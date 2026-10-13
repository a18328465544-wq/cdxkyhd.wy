import {randomUUID} from "node:crypto";
import {mkdir, readFile, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import express, {type NextFunction, type Request, type Response, type Router} from "express";
import {
  clearForumSession,
  constantTimeEqual,
  forumClientAddress,
  FORUM_SESSION_SECONDS,
  getForumSession,
  hashForumPassword,
  InMemoryRateLimiter,
  normalizeForumUsername,
  setForumSession,
  validForumPassword,
  verifyForumPassword,
  type ForumSessionClaims,
} from "./forumSecurity.js";
import {
  FORUM_CATEGORIES,
  ForumStore,
  type ForumAttachmentRecord,
  type ForumCategoryKey,
  type ForumContentStatus,
  type ForumData,
  type ForumPostRecord,
  type ForumProductReference,
  type ForumReplyRecord,
  type ForumUserRecord,
} from "./forumStore.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const REPORT_REASONS = ["广告或垃圾信息", "辱骂或骚扰", "虚假或误导内容", "泄露个人信息", "其他"] as const;

export interface ForumProductOption extends ForumProductReference {
  condition?: string;
  stockStatus?: string;
}

export interface ForumRoutesOptions {
  store: ForumStore;
  dataDirectory: string;
  sessionSecret: string;
  adminPassword: string;
  isProduction: boolean;
  findProducts: (query: string) => Promise<ForumProductOption[]>;
}

function text(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= maxLength ? normalized : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function publicUser(user: ForumUserRecord) {
  return {id: user.id, nickname: user.nickname};
}

function sessionSecretReady(secret: string): boolean {
  return Buffer.byteLength(secret, "utf8") >= 32;
}

function adminPasswordReady(password: string): boolean {
  return password.length >= 16;
}

function contentHasPhone(value: string): boolean {
  return /(?<!\d)1[3-9]\d{9}(?!\d)/.test(value);
}

function normalizeTags(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 5) return null;
  const tags: string[] = [];
  for (const raw of value) {
    const tag = text(raw, 16);
    if (!tag) return null;
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

function getPage(value: unknown): number {
  const page = Number(value || 1);
  return Number.isInteger(page) && page > 0 ? Math.min(page, 100_000) : 1;
}

function countApprovedReplies(data: ForumData, postId: string): number {
  return data.replies.filter((reply) => reply.postId === postId && reply.status === "approved").length;
}

function postSummary(post: ForumPostRecord, replyCount: number) {
  return {
    id: post.id,
    title: post.title,
    excerpt: post.body.slice(0, 240),
    category: post.category,
    tags: post.tags,
    author: post.authorName,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    replyCount,
    product: post.product,
    attachments: post.attachmentIds.map((id) => `/api/forum/uploads/${id}`),
  };
}

function postDetail(post: ForumPostRecord, replies: ForumReplyRecord[]) {
  return {
    id: post.id,
    title: post.title,
    body: post.body,
    category: post.category,
    tags: post.tags,
    author: post.authorName,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    product: post.product,
    attachments: post.attachmentIds.map((id) => `/api/forum/uploads/${id}`),
    replies: replies.map((reply) => ({
      id: reply.id,
      body: reply.body,
      author: reply.authorName,
      createdAt: reply.createdAt,
      attachments: reply.attachmentIds.map((id) => `/api/forum/uploads/${id}`),
    })),
  };
}

function setSession(res: Response, claims: ForumSessionClaims, secret: string, secure: boolean) {
  setForumSession(res, {...claims, exp: Math.floor(Date.now() / 1000) + FORUM_SESSION_SECONDS}, secret, secure);
}

function isAllowedOrigin(req: Request, allowedOrigins: Set<string>): boolean {
  const origin = req.get("origin");
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  try {
    return new URL(origin).host === req.get("host");
  } catch {
    return false;
  }
}

function imageFormat(buffer: Buffer, contentType: string | undefined): ForumAttachmentRecord["mimeType"] | null {
  if (contentType === "image/jpeg" && buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (contentType === "image/png" && buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (contentType === "image/webp" && buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

function attachmentPath(directory: string, attachment: ForumAttachmentRecord): string {
  return path.join(directory, `${attachment.id}.${attachment.extension}`);
}

export function createForumRouter(options: ForumRoutesOptions): Router {
  const router = express.Router();
  const rateLimiter = new InMemoryRateLimiter();
  const dummyPasswordHash = hashForumPassword(randomUUID());
  const secureCookie = options.isProduction;
  const allowedOrigins = new Set((process.env.CORS_ORIGIN || "").split(",").map((origin) => origin.trim()).filter(Boolean));
  const uploadDirectory = path.join(options.dataDirectory, "uploads");

  router.use((req, res, next) => {
    if (req.method === "GET" || req.method === "HEAD" || isAllowedOrigin(req, allowedOrigins)) {
      next();
      return;
    }
    res.status(403).json({error: "请求来源未获允许"});
  });

  function currentSession(req: Request, role: "user" | "admin" = "user"): ForumSessionClaims | null {
    if (!sessionSecretReady(options.sessionSecret)) return null;
    return getForumSession(req, options.sessionSecret, role);
  }

  function currentUser(req: Request): ForumUserRecord | null {
    const session = currentSession(req);
    if (!session || session.role !== "user") return null;
    return options.store.snapshot().users.find((user) => user.id === session.sub && user.status === "active") || null;
  }

  function requireUser(req: Request, res: Response): ForumUserRecord | null {
    const user = currentUser(req);
    if (!user) res.status(401).json({error: "请先登录后再操作"});
    return user;
  }

  function requireAdmin(req: Request, res: Response): boolean {
    const session = currentSession(req, "admin");
    if (session?.role === "admin" && session.sub === "forum-admin") return true;
    res.status(401).json({error: "请先登录审核后台"});
    return false;
  }

  function applyRateLimit(req: Request, res: Response, key: string, limit: number, windowMs: number): boolean {
    const result = rateLimiter.consume(key, limit, windowMs);
    if (result.allowed) return true;
    res.setHeader("Retry-After", String(Math.ceil(result.retryAfterMs / 1000)));
    res.status(429).json({error: "操作太频繁，请稍后再试"});
    return false;
  }

  router.get("/meta", (_req, res) => {
    res.json({
      success: true,
      categories: FORUM_CATEGORIES,
      authReady: sessionSecretReady(options.sessionSecret),
      moderationReady: adminPasswordReady(options.adminPassword) && sessionSecretReady(options.sessionSecret),
    });
  });

  router.get("/auth/me", (req, res) => {
    const user = currentUser(req);
    res.json({success: true, user: user ? publicUser(user) : null, role: user ? "user" : null});
  });

  router.post("/auth/register", async (req, res) => {
    const body = asRecord(req.body);
    const username = normalizeForumUsername(body.username);
    const password = body.password;
    const nickname = text(body.nickname, 20);
    if (!username || !validForumPassword(password) || !nickname || nickname.length < 2) {
      res.status(400).json({error: "请输入 4-20 位账号、至少 10 位密码和 2-20 字昵称"});
      return;
    }
    if (!sessionSecretReady(options.sessionSecret)) {
      res.status(503).json({error: "论坛登录服务尚未配置"});
      return;
    }
    const address = forumClientAddress(req);
    if (!applyRateLimit(req, res, `register-ip:${address}`, 10, 60 * 60 * 1000)) return;
    if (options.store.snapshot().users.some((user) => user.username === username)) {
      res.status(409).json({error: "该账号已被使用"});
      return;
    }
    try {
      const passwordHash = await hashForumPassword(password);
      const now = new Date().toISOString();
      const user: ForumUserRecord = {id: randomUUID(), username, passwordHash, nickname, status: "active", createdAt: now, lastSeenAt: now};
      const created = await options.store.update((draft) => {
        if (draft.users.some((item) => item.username === username)) return false;
        draft.users.push(user);
        return true;
      });
      if (!created) {
        res.status(409).json({error: "该账号已被使用"});
        return;
      }
      setSession(res, {sub: user.id, role: "user", exp: 0}, options.sessionSecret, secureCookie);
      res.status(201).json({success: true, user: publicUser(user)});
    } catch (error) {
      console.error("[forum] registration failed", error);
      res.status(500).json({error: "注册暂不可用，请稍后再试"});
    }
  });

  router.post("/auth/login", async (req, res) => {
    const body = asRecord(req.body);
    const username = normalizeForumUsername(body.username);
    const password = body.password;
    if (!username || !validForumPassword(password)) {
      res.status(400).json({error: "账号或密码格式不正确"});
      return;
    }
    if (!sessionSecretReady(options.sessionSecret)) {
      res.status(503).json({error: "论坛登录服务尚未配置"});
      return;
    }
    const address = forumClientAddress(req);
    if (!applyRateLimit(req, res, `login-ip:${address}`, 60, 15 * 60 * 1000)) return;
    if (!applyRateLimit(req, res, `login-user:${username}`, 8, 15 * 60 * 1000)) return;
    const user = options.store.snapshot().users.find((item) => item.username === username);
    try {
      const matches = await verifyForumPassword(password, user?.passwordHash || await dummyPasswordHash);
      if (!user || !matches) {
        res.status(401).json({error: "账号或密码不正确"});
        return;
      }
      if (user.status === "muted") {
        res.status(403).json({error: "账号暂时不能登录社区"});
        return;
      }
      await options.store.update((draft) => {
        const index = draft.users.findIndex((item) => item.id === user.id);
        if (index >= 0) draft.users[index].lastSeenAt = new Date().toISOString();
      });
      setSession(res, {sub: user.id, role: "user", exp: 0}, options.sessionSecret, secureCookie);
      res.json({success: true, user: publicUser(user)});
    } catch (error) {
      console.error("[forum] login failed", error);
      res.status(500).json({error: "登录暂不可用，请稍后再试"});
    }
  });

  router.post("/auth/logout", (_req, res) => {
    clearForumSession(res, secureCookie);
    res.json({success: true});
  });

  router.post("/admin/logout", (_req, res) => {
    clearForumSession(res, secureCookie, "admin");
    res.json({success: true});
  });

  router.post("/admin/login", (req, res) => {
    const address = forumClientAddress(req);
    if (!applyRateLimit(req, res, `admin-login:${address}`, 8, 15 * 60 * 1000)) return;
    const password = typeof asRecord(req.body).password === "string" ? asRecord(req.body).password as string : "";
    if (!adminPasswordReady(options.adminPassword) || !sessionSecretReady(options.sessionSecret)) {
      res.status(503).json({error: "审核后台尚未完成安全配置"});
      return;
    }
    if (!constantTimeEqual(password, options.adminPassword)) {
      res.status(401).json({error: "审核密码不正确"});
      return;
    }
    setSession(res, {sub: "forum-admin", role: "admin", exp: 0}, options.sessionSecret, secureCookie);
    res.json({success: true});
  });

  router.get("/admin/session", (req, res) => {
    const session = currentSession(req, "admin");
    res.json({success: true, authenticated: session?.role === "admin" && session.sub === "forum-admin"});
  });

  router.get("/products", async (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";
    if (query.length < 2) {
      res.json({success: true, products: []});
      return;
    }
    try {
      const products = await options.findProducts(query);
      res.json({success: true, products: products.slice(0, 12)});
    } catch {
      res.status(502).json({error: "暂时无法读取 ERP 商品，请稍后重试"});
    }
  });

  router.get("/posts", (req, res) => {
    const data = options.store.snapshot();
    const category = typeof req.query.category === "string" ? req.query.category : "all";
    const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80).toLocaleLowerCase() : "";
    const page = getPage(req.query.page);
    if (category !== "all" && !FORUM_CATEGORIES.some((item) => item.key === category)) {
      res.status(400).json({error: "社区分类无效"});
      return;
    }
    const filtered = data.posts
      .filter((post) => post.status === "approved")
      .filter((post) => category === "all" || post.category === category)
      .filter((post) => !query || [post.title, post.body, ...post.tags, post.product?.name || ""].some((value) => value.toLocaleLowerCase().includes(query)))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const pageSize = 12;
    const posts = filtered.slice((page - 1) * pageSize, page * pageSize).map((post) => postSummary(post, countApprovedReplies(data, post.id)));
    res.json({success: true, posts, total: filtered.length, page, pageSize});
  });

  router.get("/posts/:postId", (req, res) => {
    const data = options.store.snapshot();
    const post = data.posts.find((item) => item.id === req.params.postId && item.status === "approved");
    if (!post) {
      res.status(404).json({error: "帖子不存在或尚未通过审核"});
      return;
    }
    const replies = data.replies
      .filter((reply) => reply.postId === post.id && reply.status === "approved")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    res.json({success: true, post: postDetail(post, replies)});
  });

  router.get("/uploads/:attachmentId", async (req, res) => {
    const data = options.store.snapshot();
    const attachment = data.attachments.find((item) => item.id === req.params.attachmentId);
    if (!attachment) {
      res.status(404).end();
      return;
    }
    const session = currentSession(req);
    const adminSession = currentSession(req, "admin");
    const isAdmin = adminSession?.role === "admin" && adminSession.sub === "forum-admin";
    const post = data.posts.find((item) => item.attachmentIds.includes(attachment.id));
    const reply = data.replies.find((item) => item.attachmentIds.includes(attachment.id));
    const visible = isAdmin || attachment.ownerId === session?.sub ||
      (post?.status === "approved") ||
      (reply?.status === "approved" && data.posts.some((item) => item.id === reply.postId && item.status === "approved"));
    if (!visible) {
      res.status(404).end();
      return;
    }
    try {
      const contents = await readFile(attachmentPath(uploadDirectory, attachment));
      res.setHeader("Content-Type", attachment.mimeType);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.end(contents);
    } catch {
      res.status(404).end();
    }
  });

  router.post("/uploads", (req, res, next) => {
    const user = requireUser(req, res);
    if (!user) return;
    if (!applyRateLimit(req, res, `upload:${user.id}`, 12, 60 * 60 * 1000)) return;
    next();
  }, express.raw({type: ["image/jpeg", "image/png", "image/webp"], limit: MAX_IMAGE_BYTES}), async (req, res) => {
    const user = currentUser(req);
    const body = Buffer.isBuffer(req.body) ? req.body : null;
    if (!user || !body || body.length === 0 || body.length > MAX_IMAGE_BYTES) {
      res.status(400).json({error: "请选择不超过 5MB 的 JPG、PNG 或 WebP 图片"});
      return;
    }
    const mimeType = imageFormat(body, req.get("content-type"));
    if (!mimeType) {
      res.status(415).json({error: "图片格式不支持或文件内容与格式不符"});
      return;
    }
    const extension = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : "webp";
    const attachment: ForumAttachmentRecord = {id: randomUUID(), ownerId: user.id, mimeType, extension, createdAt: new Date().toISOString()};
    await mkdir(uploadDirectory, {recursive: true});
    const filePath = attachmentPath(uploadDirectory, attachment);
    try {
      await writeFile(filePath, body, {flag: "wx", mode: 0o600});
      const expired = await options.store.update((draft) => {
        const referenced = new Set([
          ...draft.posts.flatMap((post) => post.attachmentIds),
          ...draft.replies.flatMap((reply) => reply.attachmentIds),
        ]);
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        const abandoned = draft.attachments.filter((item) => !referenced.has(item.id) && Date.parse(item.createdAt) < cutoff);
        const abandonedIds = new Set(abandoned.map((item) => item.id));
        draft.attachments = draft.attachments.filter((item) => !abandonedIds.has(item.id));
        draft.attachments.push(attachment);
        return abandoned;
      });
      await Promise.all(expired.map((item) => unlink(attachmentPath(uploadDirectory, item)).catch(() => undefined)));
      res.status(201).json({success: true, attachmentId: attachment.id, url: `/api/forum/uploads/${attachment.id}`});
    } catch {
      await unlink(filePath).catch(() => undefined);
      res.status(500).json({error: "图片保存失败，请稍后重试"});
    }
  });

  router.post("/posts", async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    if (user.status === "muted") {
      res.status(403).json({error: "账号暂时不能发布内容"});
      return;
    }
    if (!applyRateLimit(req, res, `post:${user.id}`, 5, 60 * 60 * 1000)) return;
    const body = asRecord(req.body);
    const title = text(body.title, 100);
    const content = text(body.body, 8_000);
    const category = body.category;
    const tags = normalizeTags(body.tags);
    const attachmentIds = Array.isArray(body.attachmentIds) && body.attachmentIds.length <= 4 && body.attachmentIds.every((id) => typeof id === "string") ? [...new Set(body.attachmentIds as string[])] : null;
    if (!title || title.length < 5 || !content || content.length < 10 || !FORUM_CATEGORIES.some((item) => item.key === category) || !tags || !attachmentIds) {
      res.status(400).json({error: "请检查标题、正文、分类、标签和图片数量"});
      return;
    }
    if (contentHasPhone(`${title}\n${content}`)) {
      res.status(400).json({error: "正文里似乎包含手机号，请先删除或遮挡个人联系方式"});
      return;
    }
    const data = options.store.snapshot();
    const attachments = data.attachments.filter((item) => attachmentIds.includes(item.id) && item.ownerId === user.id);
    if (attachments.length !== attachmentIds.length) {
      res.status(400).json({error: "图片已失效，请重新上传"});
      return;
    }
    let product: ForumProductReference | undefined;
    if (body.productId !== undefined && body.productId !== null && body.productId !== "") {
      const productId = text(body.productId, 100);
      if (!productId) {
        res.status(400).json({error: "关联商品无效"});
        return;
      }
      try {
        const optionsList = await options.findProducts(productId);
        product = optionsList.find((item) => item.id === productId);
      } catch {
        res.status(502).json({error: "暂时无法校验 ERP 商品，请稍后重试"});
        return;
      }
      if (!product) {
        res.status(400).json({error: "关联商品已不在当前 ERP 库存中，请重新选择"});
        return;
      }
    }

    const now = new Date().toISOString();
    const post: ForumPostRecord = {
      id: randomUUID(),
      title,
      body: content,
      category: category as ForumCategoryKey,
      tags,
      authorId: user.id,
      authorName: user.nickname,
      createdAt: now,
      updatedAt: now,
      status: "pending",
      attachmentIds,
      ...(product ? {product: {id: product.id, name: product.name, category: product.category}} : {}),
    };
    await options.store.update((draft) => { draft.posts.push(post); });
    res.status(201).json({success: true, postId: post.id, status: post.status, message: "内容已提交审核，通过后会显示在社区"});
  });

  router.post("/posts/:postId/replies", async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    if (user.status === "muted") {
      res.status(403).json({error: "账号暂时不能发布内容"});
      return;
    }
    if (!applyRateLimit(req, res, `reply:${user.id}`, 20, 60 * 60 * 1000)) return;
    const data = options.store.snapshot();
    const post = data.posts.find((item) => item.id === req.params.postId && item.status === "approved");
    if (!post) {
      res.status(404).json({error: "帖子不存在或已关闭"});
      return;
    }
    const body = asRecord(req.body);
    const content = text(body.body, 2_000);
    if (!content || content.length < 2) {
      res.status(400).json({error: "回复至少填写 2 个字"});
      return;
    }
    if (contentHasPhone(content)) {
      res.status(400).json({error: "回复里似乎包含手机号，请先删除或遮挡个人联系方式"});
      return;
    }
    const attachmentIds = body.attachmentIds === undefined
      ? []
      : Array.isArray(body.attachmentIds) && body.attachmentIds.length <= 2 && body.attachmentIds.every((id) => typeof id === "string")
        ? [...new Set(body.attachmentIds as string[])]
        : null;
    if (!attachmentIds) {
      res.status(400).json({error: "回复最多添加 2 张图片"});
      return;
    }
    const attachments = data.attachments.filter((item) => attachmentIds.includes(item.id) && item.ownerId === user.id);
    if (attachments.length !== attachmentIds.length) {
      res.status(400).json({error: "图片已失效，请重新上传"});
      return;
    }
    const reply: ForumReplyRecord = {
      id: randomUUID(),
      postId: post.id,
      body: content,
      authorId: user.id,
      authorName: user.nickname,
      createdAt: new Date().toISOString(),
      status: "pending",
      attachmentIds,
    };
    await options.store.update((draft) => {
      draft.replies.push(reply);
    });
    res.status(201).json({success: true, replyId: reply.id, status: reply.status, message: "回复已提交审核"});
  });

  router.post("/posts/:postId/reports", async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    if (!applyRateLimit(req, res, `report:${user.id}`, 10, 60 * 60 * 1000)) return;
    const data = options.store.snapshot();
    const post = data.posts.find((item) => item.id === req.params.postId && item.status === "approved");
    if (!post) {
      res.status(404).json({error: "帖子不存在"});
      return;
    }
    const body = asRecord(req.body);
    const reason = typeof body.reason === "string" && REPORT_REASONS.includes(body.reason as typeof REPORT_REASONS[number]) ? body.reason : null;
    const details = typeof body.details === "string" ? body.details.trim().slice(0, 300) : "";
    if (!reason) {
      res.status(400).json({error: "请选择举报原因"});
      return;
    }
    if (data.reports.some((report) => report.targetType === "post" && report.targetId === post.id && report.reporterId === user.id && report.status === "open")) {
      res.status(409).json({error: "你已经举报过该帖子"});
      return;
    }
    await options.store.update((draft) => {
      draft.reports.push({id: randomUUID(), targetType: "post", targetId: post.id, reporterId: user.id, reason, details, status: "open", createdAt: new Date().toISOString()});
    });
    res.status(201).json({success: true, message: "收到举报，管理员会尽快处理"});
  });

  router.post("/replies/:replyId/reports", async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return;
    if (!applyRateLimit(req, res, `report:${user.id}`, 10, 60 * 60 * 1000)) return;
    const data = options.store.snapshot();
    const reply = data.replies.find((item) => item.id === req.params.replyId && item.status === "approved");
    if (!reply || !data.posts.some((post) => post.id === reply.postId && post.status === "approved")) {
      res.status(404).json({error: "回复不存在"});
      return;
    }
    const body = asRecord(req.body);
    const reason = typeof body.reason === "string" && REPORT_REASONS.includes(body.reason as typeof REPORT_REASONS[number]) ? body.reason : null;
    const details = typeof body.details === "string" ? body.details.trim().slice(0, 300) : "";
    if (!reason) {
      res.status(400).json({error: "请选择举报原因"});
      return;
    }
    if (data.reports.some((report) => report.targetType === "reply" && report.targetId === reply.id && report.reporterId === user.id && report.status === "open")) {
      res.status(409).json({error: "你已经举报过该回复"});
      return;
    }
    await options.store.update((draft) => {
      draft.reports.push({id: randomUUID(), targetType: "reply", targetId: reply.id, reporterId: user.id, reason, details, status: "open", createdAt: new Date().toISOString()});
    });
    res.status(201).json({success: true, message: "收到举报，管理员会尽快处理"});
  });

  router.get("/admin/queue", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const data = options.store.snapshot();
    const pendingPosts = data.posts.filter((post) => post.status === "pending").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const pendingReplies = data.replies.filter((reply) => reply.status === "pending").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const openReports = data.reports.filter((report) => report.status === "open").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    res.json({
      success: true,
      posts: pendingPosts.map((post) => ({...post, attachments: post.attachmentIds.map((id) => `/api/forum/uploads/${id}`)})),
      replies: pendingReplies.map((reply) => ({...reply, postTitle: data.posts.find((post) => post.id === reply.postId)?.title || "已删除帖子", attachments: reply.attachmentIds.map((id) => `/api/forum/uploads/${id}`)})),
      reports: openReports.map((report) => ({...report, reporterName: data.users.find((user) => user.id === report.reporterId)?.nickname || "社区用户", targetTitle: report.targetType === "post" ? data.posts.find((post) => post.id === report.targetId)?.title || "帖子已删除" : data.replies.find((reply) => reply.id === report.targetId)?.body.slice(0, 80) || "回复已删除"})),
      moderationLogs: data.moderationLogs.slice(-50).reverse(),
    });
  });

  router.patch("/admin/posts/:postId", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const body = asRecord(req.body);
    const status = body.status;
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 200) : "";
    if (!(["approved", "rejected", "hidden"] as ForumContentStatus[]).includes(status as ForumContentStatus)) {
      res.status(400).json({error: "审核状态无效"});
      return;
    }
    const postId = req.params.postId;
    const now = new Date().toISOString();
    const updated = await options.store.update((draft) => {
      const post = draft.posts.find((item) => item.id === postId);
      if (!post) return false;
      const previousStatus = post.status;
      post.status = status as ForumContentStatus;
      post.updatedAt = now;
      draft.moderationLogs.push({id: randomUUID(), actor: "admin", action: `${previousStatus}->${post.status}`, targetType: "post", targetId: postId, note, createdAt: now});
      return true;
    });
    if (!updated) {
      res.status(404).json({error: "帖子不存在"});
      return;
    }
    res.json({success: true});
  });

  router.patch("/admin/replies/:replyId", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const body = asRecord(req.body);
    const status = body.status;
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 200) : "";
    if (!(["approved", "rejected", "hidden"] as ForumContentStatus[]).includes(status as ForumContentStatus)) {
      res.status(400).json({error: "审核状态无效"});
      return;
    }
    const replyId = req.params.replyId;
    const now = new Date().toISOString();
    const updated = await options.store.update((draft) => {
      const reply = draft.replies.find((item) => item.id === replyId);
      if (!reply) return false;
      const previousStatus = reply.status;
      reply.status = status as ForumContentStatus;
      if (reply.status === "approved") {
        const post = draft.posts.find((item) => item.id === reply.postId);
        if (post && post.status === "approved") post.updatedAt = now;
      }
      draft.moderationLogs.push({id: randomUUID(), actor: "admin", action: `${previousStatus}->${reply.status}`, targetType: "reply", targetId: replyId, note, createdAt: now});
      return true;
    });
    if (!updated) {
      res.status(404).json({error: "回复不存在"});
      return;
    }
    res.json({success: true});
  });

  router.patch("/admin/reports/:reportId", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const body = asRecord(req.body);
    const status = body.status;
    if (status !== "dismissed" && status !== "actioned") {
      res.status(400).json({error: "举报处理状态无效"});
      return;
    }
    const reportId = req.params.reportId;
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 200) : "";
    const now = new Date().toISOString();
    const updated = await options.store.update((draft) => {
      const report = draft.reports.find((item) => item.id === reportId);
      if (!report) return false;
      report.status = status;
      if (status === "actioned") {
        if (report.targetType === "post") {
          const post = draft.posts.find((item) => item.id === report.targetId);
          if (post) post.status = "hidden";
        } else {
          const reply = draft.replies.find((item) => item.id === report.targetId);
          if (reply) reply.status = "hidden";
        }
      }
      draft.moderationLogs.push({id: randomUUID(), actor: "admin", action: status, targetType: "report", targetId: reportId, note, createdAt: now});
      return true;
    });
    if (!updated) {
      res.status(404).json({error: "举报记录不存在"});
      return;
    }
    res.json({success: true});
  });

  router.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if ((error as {status?: number})?.status === 413) {
      res.status(413).json({error: "图片超过 5MB 限制"});
      return;
    }
    next(error);
  });

  return router;
}

