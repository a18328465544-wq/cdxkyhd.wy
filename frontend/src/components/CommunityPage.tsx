import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import { useLocation } from "react-router-dom";
import { useSiteNavigation } from "../routes/SiteNavigation";
import {Dialog as BaseDialog} from "@base-ui/react/dialog";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Flag,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  PackageSearch,
  Plus,
  ShieldCheck,
  ThumbsDown,
  X,
} from "lucide-react";
import {apiFetch, apiUrl} from "../lib/api";
import {Button, Input, SearchInput, SegmentedControl, Select, Textarea} from "./ui/controls";

type ForumCategory = {key: string; label: string};
type ForumUser = {id: string; nickname: string};
type ProductOption = {id: string; name: string; category: string; condition?: string; stockStatus?: string};
type PostSummary = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  product?: ProductOption;
  attachments: string[];
};
type PostDetail = Omit<PostSummary, "excerpt" | "replyCount" | "attachments"> & {
  body: string;
  attachments: string[];
  replies: Array<{id: string; body: string; author: string; createdAt: string; attachments: string[]}>;
};
type ForumMeta = {success: boolean; categories: ForumCategory[]; authReady: boolean; moderationReady: boolean};
type ModerationPost = {
  id: string;
  title: string;
  body: string;
  authorName: string;
  category: string;
  createdAt: string;
  attachments: string[];
};
type ModerationReply = {id: string; postId: string; postTitle: string; body: string; authorName: string; createdAt: string; attachments: string[]};
type ModerationReport = {id: string; targetType: "post" | "reply"; targetId: string; reporterName: string; targetTitle: string; reason: string; details: string; createdAt: string};
type QueueData = {posts: ModerationPost[]; replies: ModerationReply[]; reports: ModerationReport[]};
type DraftImage = {file: File; preview: string};

const FALLBACK_CATEGORIES: ForumCategory[] = [
  {key: "all", label: "全部话题"},
  {key: "gpu", label: "显卡选购"},
  {key: "build", label: "装机配置"},
  {key: "used", label: "二手检测"},
  {key: "troubleshoot", label: "故障求助"},
  {key: "shop", label: "门店交流"},
];

const CATEGORY_LABELS = Object.fromEntries(FALLBACK_CATEGORIES.map(({key, label}) => [key, label]));
const REPORT_REASONS = ["广告或垃圾信息", "辱骂或骚扰", "虚假或误导内容", "泄露个人信息", "其他"];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间未知";
  return new Intl.DateTimeFormat("zh-CN", {month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"}).format(date);
}

function categoryLabel(key: string): string {
  return CATEGORY_LABELS[key] || key;
}

function readPostIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/community\/post\/([\w-]+)$/);
  return match?.[1] || null;
}

function ImageStrip({images, compact = false}: {images: string[]; compact?: boolean}) {
  if (!images.length) return null;
  return (
    <div className={`mt-3 flex flex-wrap gap-2 ${compact ? "" : "sm:gap-3"}`}>
      {images.map((image) => (
        <a key={image} href={apiUrl(image)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border border-slate-200 bg-slate-100">
          <img src={apiUrl(image)} alt="帖子图片" loading="lazy" className={`${compact ? "h-16 w-16" : "h-24 w-24 sm:h-32 sm:w-32"} object-cover`} />
        </a>
      ))}
    </div>
  );
}

export default function CommunityPage() {
  const { pathname } = useLocation();
  const { navigate } = useSiteNavigation();
  const [meta, setMeta] = useState<ForumMeta | null>(null);
  const [user, setUser] = useState<ForumUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadIndex, setReloadIndex] = useState(0);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const postId = readPostIdFromPath(pathname);
  const [postDetail, setPostDetail] = useState<PostDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{type: "posts" | "replies"; id: string} | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [queue, setQueue] = useState<QueueData>({posts: [], replies: [], reports: []});
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState("");
  const isManagePage = pathname === "/community/manage";
  const isHomePage = !postId && !isManagePage;

  const refreshSession = useCallback(async () => {
    try {
      const [session, adminSession] = await Promise.all([
        apiFetch<{user: ForumUser | null; role: string | null}>("/api/forum/auth/me"),
        apiFetch<{authenticated: boolean}>("/api/forum/admin/session"),
      ]);
      setUser(session.user);
      setIsAdmin(adminSession.authenticated);
      setAdminAuthenticated(adminSession.authenticated);
    } catch {
      setUser(null);
      setIsAdmin(false);
      setAdminAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    void apiFetch<ForumMeta>("/api/forum/meta").then(setMeta).catch(() => setMeta(null));
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCommittedSearch(search.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isHomePage) return;
    const params = new URLSearchParams({page: String(page), category});
    if (committedSearch) params.set("q", committedSearch);
    setLoading(true);
    void apiFetch<{posts: PostSummary[]; total: number}>(`/api/forum/posts?${params.toString()}`)
      .then((data) => {
        setPosts(data.posts);
        setTotal(data.total);
        setPageError("");
      })
      .catch((error: Error) => setPageError(error.message || "社区内容暂时无法加载"))
      .finally(() => setLoading(false));
  }, [category, committedSearch, isHomePage, page, reloadIndex]);

  useEffect(() => {
    if (!postId) {
      setPostDetail(null);
      setDetailError("");
      return;
    }
    setDetailLoading(true);
    setPostDetail(null);
    void apiFetch<{post: PostDetail}>(`/api/forum/posts/${encodeURIComponent(postId)}`)
      .then((data) => {
        setPostDetail(data.post);
        setDetailError("");
      })
      .catch((error: Error) => setDetailError(error.message || "帖子暂时无法打开"))
      .finally(() => setDetailLoading(false));
  }, [postId]);

  const openPost = (id: string) => {
    navigate(`/community/post/${encodeURIComponent(id)}`);
  };

  const closePost = () => {
    navigate("/community");
  };

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    setQueueError("");
    try {
      const data = await apiFetch<QueueData>("/api/forum/admin/queue");
      setQueue(data);
    } catch (error) {
      setQueueError(error instanceof Error ? error.message : "审核队列加载失败");
    } finally {
      setQueueLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isManagePage && adminAuthenticated) void loadQueue();
  }, [adminAuthenticated, isManagePage, loadQueue]);

  const categories = useMemo(() => {
    if (!meta?.categories?.length) return FALLBACK_CATEGORIES;
    return [{key: "all", label: "全部话题"}, ...meta.categories];
  }, [meta]);

  const maxPage = Math.max(1, Math.ceil(total / 12));

  const logout = async () => {
    await apiFetch("/api/forum/auth/logout", {method: "POST"}).catch(() => undefined);
    setUser(null);
    setNotice("已退出用户登录");
  };

  const logoutAdmin = async () => {
    await apiFetch("/api/forum/admin/logout", {method: "POST"}).catch(() => undefined);
    setIsAdmin(false);
    setAdminAuthenticated(false);
    setNotice("已退出审核后台");
  };

  const handleAdminLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQueueError("");
    try {
      await apiFetch("/api/forum/admin/login", {method: "POST", body: JSON.stringify({password: adminPassword})});
      setAdminPassword("");
      setAdminAuthenticated(true);
      setIsAdmin(true);
      setNotice("已进入审核后台");
    } catch (error) {
      setQueueError(error instanceof Error ? error.message : "登录失败");
    }
  };

  const moderate = async (kind: "posts" | "replies", id: string, status: "approved" | "rejected" | "hidden") => {
    const endpoint = kind === "posts" ? "posts" : "replies";
    try {
      await apiFetch(`/api/forum/admin/${endpoint}/${encodeURIComponent(id)}`, {method: "PATCH", body: JSON.stringify({status})});
      setNotice(status === "approved" ? "已通过审核" : status === "hidden" ? "内容已隐藏" : "已拒绝发布");
      await loadQueue();
    } catch (error) {
      setQueueError(error instanceof Error ? error.message : "审核操作失败");
    }
  };

  const updateReport = async (id: string, status: "dismissed" | "actioned") => {
    try {
      await apiFetch(`/api/forum/admin/reports/${encodeURIComponent(id)}`, {method: "PATCH", body: JSON.stringify({status})});
      setNotice("举报已处理");
      await loadQueue();
    } catch (error) {
      setQueueError(error instanceof Error ? error.message : "处理举报失败");
    }
  };

  const refreshDetail = async () => {
    if (!postId) return;
    try {
      const data = await apiFetch<{post: PostDetail}>(`/api/forum/posts/${encodeURIComponent(postId)}`);
      setPostDetail(data.post);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "刷新帖子失败");
    }
  };

  const accountActions = (
    <div className="flex flex-wrap items-center gap-2">
      {isAdmin && (
        <>
          <a href="/community/manage" className="rounded-md px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">审核后台</a>
          <Button onClick={() => void logoutAdmin()}>退出审核</Button>
        </>
      )}
      {user ? (
        <>
          <span className="max-w-36 truncate text-sm text-slate-600">{user.nickname}</span>
          <Button onClick={() => void logout()}>退出</Button>
        </>
      ) : (
        <Button onClick={() => setLoginOpen(true)}>登录 / 注册</Button>
      )}
    </div>
  );

  return (
    <div className="flex-1 bg-slate-50 pt-16 text-slate-900 sm:pt-20">
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        {notice && (
          <div role="status" className="mb-4 flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} aria-label="关闭提示" className="rounded p-1 hover:bg-emerald-100"><X className="h-4 w-4" /></button>
          </div>
        )}

        {!isHomePage && <div className="mb-5 flex justify-end">{accountActions}</div>}

        {isManagePage ? (
          <section aria-labelledby="moderation-title">
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <a href="/community" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />返回社区</a>
                <h1 id="moderation-title" className="text-2xl font-bold text-slate-950">内容审核</h1>
                <p className="mt-1 text-sm text-slate-600">审核帖子、回复和顾客举报</p>
              </div>
              {adminAuthenticated && <Button onClick={() => void loadQueue()} loading={queueLoading}>刷新</Button>}
            </div>
            {!adminAuthenticated ? (
              <form onSubmit={(event) => void handleAdminLogin(event)} className="max-w-md border-y border-slate-200 bg-white px-4 py-6 sm:px-6">
                <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-slate-800">管理员密码</label>
                <Input id="admin-password" type="password" autoComplete="current-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} required />
                {queueError && <p role="alert" className="mt-2 text-sm text-rose-700">{queueError}</p>}
                <Button type="submit" variant="primary" className="mt-4"><LockKeyhole className="h-4 w-4" />进入审核</Button>
                {!meta?.moderationReady && <p className="mt-3 text-xs leading-5 text-amber-800">审核后台尚未完成配置。请在服务器设置管理员密码和会话密钥。</p>}
              </form>
            ) : (
              <>
                {queueError && <p role="alert" className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{queueError}</p>}
                {queueLoading ? <LoadingState label="正在读取待审核内容" /> : (
                  <div className="space-y-10">
                    <ModerationSection title={`待审帖子 · ${queue.posts.length}`} empty="目前没有待审核帖子">
                      {queue.posts.map((item) => (
                        <div key={item.id}><ModerationItem title={item.title} category={categoryLabel(item.category)} author={item.authorName} time={formatDate(item.createdAt)} body={item.body} images={item.attachments} onApprove={() => void moderate("posts", item.id, "approved")} onReject={() => void moderate("posts", item.id, "rejected")} onHide={() => void moderate("posts", item.id, "hidden")} /></div>
                      ))}
                    </ModerationSection>
                    <ModerationSection title={`待审回复 · ${queue.replies.length}`} empty="目前没有待审核回复">
                      {queue.replies.map((item) => (
                        <div key={item.id}><ModerationItem title={`回复：${item.postTitle}`} category="回复" author={item.authorName} time={formatDate(item.createdAt)} body={item.body} images={item.attachments} onApprove={() => void moderate("replies", item.id, "approved")} onReject={() => void moderate("replies", item.id, "rejected")} onHide={() => void moderate("replies", item.id, "hidden")} /></div>
                      ))}
                    </ModerationSection>
                    <ModerationSection title={`待处理举报 · ${queue.reports.length}`} empty="目前没有待处理举报">
                      {queue.reports.map((item) => (
                        <div key={item.id} className="border-b border-slate-200 py-5 last:border-0">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500"><span>{item.reporterName} 举报</span><span>{formatDate(item.createdAt)}</span><span className="font-semibold text-rose-700">{item.reason}</span></div>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{item.targetTitle}</p>
                          {item.details && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{item.details}</p>}
                          <div className="mt-3 flex gap-2">
                            <Button onClick={() => void updateReport(item.id, "actioned")} variant="danger" size="sm">已采取处理</Button>
                            <Button onClick={() => void updateReport(item.id, "dismissed")} size="sm">不违规</Button>
                          </div>
                        </div>
                      ))}
                    </ModerationSection>
                  </div>
                )}
              </>
            )}
          </section>
        ) : postId ? (
          <section>
            <button onClick={closePost} className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />返回话题列表</button>
            {detailLoading ? <LoadingState label="正在打开话题" /> : detailError ? <ErrorState message={detailError} onRetry={() => void refreshDetail()} /> : postDetail ? (
              <article className="border-y border-slate-200 bg-white px-4 py-6 sm:px-8 sm:py-8">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
                  <span className="rounded bg-blue-50 px-2 py-1 font-semibold text-blue-700">{categoryLabel(postDetail.category)}</span>
                  <span>{postDetail.author}</span>
                  <span>{formatDate(postDetail.createdAt)}</span>
                  <button onClick={() => user ? setReportTarget({type: "posts", id: postDetail.id}) : setLoginOpen(true)} className="ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-slate-500 hover:bg-slate-50 hover:text-rose-700"><Flag className="h-3.5 w-3.5" />举报</button>
                </div>
                <h1 className="mt-4 break-words text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">{postDetail.title}</h1>
                <div className="mt-5 flex flex-wrap gap-2">{postDetail.tags.map((tag) => <span key={tag} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{tag}</span>)}</div>
                {postDetail.product && <ProductReference product={postDetail.product} />}
                <p className="mt-6 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 sm:text-base">{postDetail.body}</p>
                <ImageStrip images={postDetail.attachments} />
                <div className="mt-8 flex items-center gap-2 border-t border-slate-100 pt-5 text-sm font-semibold text-slate-800"><MessageCircle className="h-4 w-4 text-blue-600" />回复（{postDetail.replies.length}）</div>
                <div className="divide-y divide-slate-100">
                  {postDetail.replies.map((reply) => (
                    <div key={reply.id} className="py-4">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500"><span className="font-semibold text-slate-700">{reply.author}</span><span>{formatDate(reply.createdAt)}</span></div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{reply.body}</p>
                      <ImageStrip images={reply.attachments} compact />
                      <button onClick={() => user ? setReportTarget({type: "replies", id: reply.id}) : setLoginOpen(true)} className="mt-2 inline-flex items-center gap-1 rounded px-1 py-1 text-xs text-slate-500 hover:text-rose-700"><Flag className="h-3 w-3" />举报回复</button>
                    </div>
                  ))}
                  {postDetail.replies.length === 0 && <p className="py-5 text-sm text-slate-500">还没有回复，欢迎分享你的经验。</p>}
                </div>
                <ReplyForm user={user} onLogin={() => setLoginOpen(true)} postId={postDetail.id} onSubmitted={async (message) => { setNotice(message); await refreshDetail(); }} />
              </article>
            ) : null}
          </section>
        ) : (
          <>
            <section className="page-heading">
              <div className="flex w-full flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <h1 className="page-title">显卡与装机交流</h1>
                  <p className="page-description">选卡、装机、二手检测与故障排查，分享真实经验。</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  {accountActions}
                  {posts.length > 0 && (
                    <Button onClick={() => user ? setComposerOpen(true) : setLoginOpen(true)} variant="primary"><Plus className="h-4 w-4" />发起讨论</Button>
                  )}
                </div>
              </div>
            </section>

            <section aria-label="社区话题">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                  <SegmentedControl label="话题分类" className="w-full lg:flex-1" options={categories.map(item => ({value: item.key, label: item.label}))} value={category} onChange={value => {setCategory(value); setPage(1);}} />
                  <SearchInput aria-label="搜索话题、型号或标签" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索话题、型号或标签" className="w-full lg:max-w-72 lg:shrink-0" />
              </div>

              <p className="flex items-start gap-2 border-b border-slate-200 py-3 text-xs leading-6 text-slate-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>请勿发布手机号、完整 SN 或订单信息。内容审核后公开；账号名不会随帖子展示。</span>
              </p>
              {!meta?.authReady && <p className="border-b border-amber-200 py-3 text-xs leading-5 text-amber-800">账号服务正在配置，当前可以浏览社区内容。</p>}

                {pageError ? <ErrorState message={pageError} onRetry={() => setReloadIndex((value) => value + 1)} /> : loading ? <LoadingState label="正在加载话题" /> : posts.length ? (
                  <>
                    <div className="divide-y divide-slate-200">
                      {posts.map((post) => (
                        <article key={post.id} className="py-5 sm:py-6">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-700">{categoryLabel(post.category)}</span>
                            <span>{post.author}</span><span>{formatDate(post.createdAt)}</span>
                          </div>
                          <button onClick={() => openPost(post.id)} className="mt-3 block w-full break-words text-left text-lg font-bold leading-7 text-slate-950 hover:text-blue-700 sm:text-xl">{post.title}</button>
                          <p className="mt-2 max-w-4xl line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{post.excerpt}</p>
                          {post.product && <div className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-800"><PackageSearch className="h-3.5 w-3.5 shrink-0" /><span className="truncate">关联型号：{post.product.name}</span></div>}
                          {post.attachments?.length > 0 && <ImageStrip images={post.attachments.slice(0, 3)} compact />}
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap gap-1.5">{post.tags.map((tag) => <span key={tag} className="text-xs text-slate-500">#{tag}</span>)}</div>
                            <button onClick={() => openPost(post.id)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700"><MessageCircle className="h-3.5 w-3.5" />{post.replyCount} 条回复<ArrowRight className="h-3.5 w-3.5" /></button>
                          </div>
                        </article>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 py-4 text-sm text-slate-600">
                      <span>共 {total} 个话题 · 第 {page} / {maxPage} 页</span>
                      <div className="flex gap-2">
                        <Button aria-label="上一页" size="icon" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="h-4 w-4" /></Button>
                        <Button aria-label="下一页" size="icon" disabled={page >= maxPage} onClick={() => setPage((value) => Math.min(maxPage, value + 1))}><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="border-b border-slate-200 py-10 text-center sm:py-12">
                    <CircleHelp className="mx-auto h-7 w-7 text-slate-400" />
                    <h2 className="mt-2 text-base font-semibold text-slate-900">这里还没有话题</h2>
                    <p className="mt-1 text-sm text-slate-600">发起第一个讨论，聊聊你正在选的显卡或配置。</p>
                    <Button onClick={() => user ? setComposerOpen(true) : setLoginOpen(true)} variant="primary" className="mt-4"><Plus className="h-4 w-4" />发起讨论</Button>
                  </div>
                )}
            </section>
          </>
        )}
      </main>

      {loginOpen && <LoginDialog meta={meta} onClose={() => setLoginOpen(false)} onSuccess={(nextUser) => {setUser(nextUser); setLoginOpen(false); setNotice(`欢迎你，${nextUser.nickname}`);}} />}
      {composerOpen && <PostComposer categories={categories.filter((item) => item.key !== "all")} onClose={() => setComposerOpen(false)} onSubmitted={(message) => {setComposerOpen(false); setNotice(message); setCategory("all"); setCommittedSearch(""); setSearch(""); setPage(1);}} />}
      {reportTarget && <ReportDialog targetType={reportTarget.type} targetId={reportTarget.id} onClose={() => setReportTarget(null)} onSubmitted={(message) => {setReportTarget(null); setNotice(message);}} />}
    </div>
  );
}

function LoadingState({label}: {label: string}) {
  return <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin text-blue-600" />{label}</div>;
}

function ErrorState({message, onRetry}: {message: string; onRetry: () => void}) {
  return <div className="border-b border-rose-200 bg-rose-50 px-4 py-8 text-center"><p role="alert" className="text-sm font-medium text-rose-800">{message}</p><Button onClick={onRetry} size="sm" className="mt-3">重新加载</Button></div>;
}

function ProductReference({product}: {product: ProductOption}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-l-2 border-blue-500 bg-blue-50/70 px-3 py-3 text-sm">
      <PackageSearch className="h-4 w-4 shrink-0 text-blue-700" />
      <span className="font-semibold text-slate-900">关联型号：{product.name}</span>
      <span className="text-xs text-slate-600">库存和价格以现货页 ERP 数据为准</span>
      <a href="/#inventory" className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900">查看现货<ArrowRight className="h-3.5 w-3.5" /></a>
    </div>
  );
}

function LoginDialog({meta, onClose, onSuccess}: {meta: ForumMeta | null; onClose: () => void; onSuccess: (user: ForumUser) => void}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === "register" && password !== confirmation) {
      setError("两次输入的密码不一致");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await apiFetch<{user: ForumUser}>(`/api/forum/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(mode === "register" ? {username, password, nickname} : {username, password}),
      });
      onSuccess(result.user);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : mode === "register" ? "注册失败" : "登录失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogShell title="社区账号" onClose={onClose}>
      <SegmentedControl label="账号操作" className="mb-5 w-full" options={[{value: "login", label: "登录"}, {value: "register", label: "注册"}]} value={mode} onChange={value => {setMode(value); setError("");}} />
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <label className="block text-sm font-semibold text-slate-800">账号名
          <Input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required minLength={4} maxLength={20} pattern="[A-Za-z0-9_]{4,20}" title="4-20 位字母、数字或下划线" placeholder="4-20 位字母、数字或下划线" className="mt-1.5" />
        </label>
        {mode === "register" && <label className="block text-sm font-semibold text-slate-800">社区昵称
          <Input value={nickname} onChange={(event) => setNickname(event.target.value)} required minLength={2} maxLength={20} placeholder="发帖时公开显示的名字" className="mt-1.5" />
        </label>}
        <label className="block text-sm font-semibold text-slate-800">密码
          <Input type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={10} maxLength={128} placeholder={mode === "register" ? "至少 10 位" : "输入密码"} className="mt-1.5" />
        </label>
        {mode === "register" && <label className="block text-sm font-semibold text-slate-800">确认密码
          <Input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={10} maxLength={128} placeholder="再次输入密码" className="mt-1.5" />
        </label>}
        {error && <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
        {!meta?.authReady && <p className="rounded-md bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">账号服务尚未配置，暂不能登录。浏览社区不受影响。</p>}
        {mode === "register" && <p className="text-xs leading-5 text-slate-500">请妥善保存账号和密码，目前暂不支持自助找回。发帖内容审核后公开。</p>}
        <Button type="submit" disabled={busy || !meta?.authReady} loading={busy} variant="primary" size="lg" className="w-full">{mode === "register" ? "注册并登录" : "登录"}</Button>
        <a href="/community/manage" className="block text-center text-xs font-medium text-slate-500 hover:text-blue-700">管理员入口</a>
      </form>
    </DialogShell>
  );
}

function PostComposer({categories, onClose, onSubmitted}: {categories: ForumCategory[]; onClose: () => void; onSubmitted: (message: string) => void}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(categories[0]?.key || "gpu");
  const [tags, setTags] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<ProductOption[]>([]);
  const [product, setProduct] = useState<ProductOption | null>(null);
  const [images, setImages] = useState<DraftImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const previews = useRef<string[]>([]);

  useEffect(() => () => previews.current.forEach((url) => URL.revokeObjectURL(url)), []);
  useEffect(() => {
    if (productQuery.trim().length < 2 || product) {
      setProductResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void apiFetch<{products: ProductOption[]}>(`/api/forum/products?q=${encodeURIComponent(productQuery.trim())}`)
        .then((result) => setProductResults(result.products))
        .catch(() => setProductResults([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [productQuery, product]);

  const addImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.currentTarget.files;
    const files: File[] = selectedFiles ? Array.from<File>(selectedFiles as ArrayLike<File>).filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 5 * 1024 * 1024) : [];
    const next = files.slice(0, Math.max(0, 4 - images.length)).map((file) => {
      const preview = URL.createObjectURL(file);
      previews.current.push(preview);
      return {file, preview};
    });
    setImages((current) => [...current, ...next]);
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((current) => {
      const removed = current[index];
      if (removed) {
        URL.revokeObjectURL(removed.preview);
        previews.current = previews.current.filter((url) => url !== removed.preview);
      }
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const attachmentIds: string[] = [];
      for (const image of images) {
        const response = await fetch(apiUrl("/api/forum/uploads"), {method: "POST", headers: {"Content-Type": image.file.type}, body: image.file});
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "图片上传失败");
        attachmentIds.push(data.attachmentId as string);
      }
      const result = await apiFetch<{message: string}>("/api/forum/posts", {
        method: "POST",
        body: JSON.stringify({title, body, category, tags: tags.split(/[，,]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 5), productId: product?.id, attachmentIds}),
      });
      onSubmitted(result.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "提交失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogShell title="发起讨论" onClose={onClose} wide>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
          <label className="block text-sm font-semibold text-slate-800">话题分类
            <Select value={category} onValueChange={setCategory} options={categories.map(item => ({value: item.key, label: item.label}))} aria-label="话题分类" className="mt-1.5" />
          </label>
          <label className="block text-sm font-semibold text-slate-800">标题
            <Input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={5} maxLength={100} placeholder="例如：RTX 4080 Super 配什么电源比较合适？" className="mt-1.5" />
          </label>
        </div>
        <label className="block text-sm font-semibold text-slate-800">详细描述
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} required minLength={10} maxLength={8000} rows={7} placeholder="说说你的用途、预算、已有配件或遇到的问题。请勿填写手机号、完整 SN 和订单信息。" className="mt-1.5 leading-6" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-800">标签
            <Input value={tags} onChange={(event) => setTags(event.target.value)} maxLength={100} placeholder="显卡, 电源, 预算（最多 5 个）" className="mt-1.5" />
          </label>
          <div className="relative">
            <label htmlFor="forum-product-search" className="block text-sm font-semibold text-slate-800">关联在售型号（选填）</label>
            <Input id="forum-product-search" value={product?.name || productQuery} onChange={(event) => {setProduct(null); setProductQuery(event.target.value);}} maxLength={80} placeholder="输入至少 2 个字搜索 ERP 库存" className="mt-1.5" />
            {productResults.length > 0 && !product && <div className="absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">{productResults.map((item) => <button type="button" key={item.id} onClick={() => {setProduct(item); setProductQuery(item.name); setProductResults([]);}} className="block w-full border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-blue-50"><span className="block truncate text-sm font-medium text-slate-900">{item.name}</span><span className="text-xs text-slate-500">{categoryLabel(item.category)} · {item.condition || "成色以库存页为准"} · {item.stockStatus || "库存状态以 ERP 为准"}</span></button>)}</div>}
            <p className="mt-1 text-xs text-slate-500">只关联当前 ERP 在库商品，不保存价格和库存数量。</p>
          </div>
        </div>
        {product && <div className="flex items-center justify-between gap-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-900"><span className="truncate">已关联：{product.name}</span><button type="button" onClick={() => {setProduct(null); setProductQuery("");}} className="shrink-0 rounded p-1 hover:bg-blue-100" aria-label="移除关联商品"><X className="h-4 w-4" /></button></div>}
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ImagePlus className="h-4 w-4" />添加图片<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addImages} className="sr-only" /></label>
            <span className="text-xs text-slate-500">最多 4 张，每张不超过 5MB；支持 JPG、PNG、WebP</span>
          </div>
          {images.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{images.map((image, index) => <div key={image.preview} className="relative"><img src={image.preview} alt="待上传图片预览" className="h-20 w-20 rounded-md border border-slate-200 object-cover" /><button type="button" onClick={() => removeImage(index)} aria-label="移除图片" className="absolute -right-2 -top-2 rounded-full bg-slate-900 p-1 text-white"><X className="h-3 w-3" /></button></div>)}</div>}
        </div>
        {error && <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
        <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center">
          <p className="text-xs leading-5 text-slate-500">提交后先由门店审核，通过后公开显示。</p>
          <div className="flex justify-end gap-2"><Button onClick={onClose}>取消</Button><Button type="submit" disabled={busy} loading={busy} variant="primary">提交审核</Button></div>
        </div>
      </form>
    </DialogShell>
  );
}

function ReplyForm({user, onLogin, postId, onSubmitted}: {user: ForumUser | null; onLogin: () => void; postId: string; onSubmitted: (message: string) => Promise<void>}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return onLogin();
    setBusy(true);
    setError("");
    try {
      const result = await apiFetch<{message: string}>(`/api/forum/posts/${encodeURIComponent(postId)}/replies`, {method: "POST", body: JSON.stringify({body})});
      setBody("");
      await onSubmitted(result.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "回复提交失败");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={(event) => void submit(event)} className="mt-5 border-t border-slate-200 pt-5">
      <label htmlFor="reply-body" className="mb-2 block text-sm font-semibold text-slate-800">参与讨论</label>
      <Textarea id="reply-body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} minLength={2} required rows={3} placeholder={user ? "分享你的经验或继续提问" : "登录后可以回复"} disabled={!user} className="leading-6" />
      {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-500">回复通过审核后公开显示，请勿留下手机号。</span>{user ? <Button type="submit" disabled={busy} loading={busy} variant="primary">提交回复</Button> : <Button onClick={onLogin} variant="primary">登录后回复</Button>}</div>
    </form>
  );
}

function ReportDialog({targetType, targetId, onClose, onSubmitted}: {targetType: "posts" | "replies"; targetId: string; onClose: () => void; onSubmitted: (message: string) => void}) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const endpoint = targetType === "posts" ? `posts/${encodeURIComponent(targetId)}/reports` : `replies/${encodeURIComponent(targetId)}/reports`;
      const result = await apiFetch<{message: string}>(`/api/forum/${endpoint}`, {method: "POST", body: JSON.stringify({reason, details})});
      onSubmitted(result.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "举报提交失败");
    } finally {
      setBusy(false);
    }
  };
  return <DialogShell title="举报话题" onClose={onClose}>
    <form onSubmit={(event) => void submit(event)} className="space-y-3">
      {REPORT_REASONS.map((item) => <label key={item} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="radio" name="report-reason" value={item} checked={reason === item} onChange={() => setReason(item)} className="accent-blue-600" />{item}</label>)}
      <Textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={300} rows={3} placeholder="补充说明（选填）" />
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <div className="flex justify-end gap-2"><Button onClick={onClose}>取消</Button><Button type="submit" disabled={busy} loading={busy} variant="danger">提交举报</Button></div>
    </form>
  </DialogShell>;
}

function DialogShell({title, onClose, wide = false, children}: {title: string; onClose: () => void; wide?: boolean; children: React.ReactNode}) {
  return (
    <BaseDialog.Root open onOpenChange={open => {if (!open) onClose();}}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/30" />
        <BaseDialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <BaseDialog.Popup className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-lg border border-[var(--erp-color-border)] bg-white p-4 shadow-[var(--erp-shadow-popover)] sm:rounded-lg sm:p-6 ${wide ? "max-w-3xl" : "max-w-md"}`}>
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <BaseDialog.Title className="text-lg font-semibold text-[var(--erp-color-text)]">{title}</BaseDialog.Title>
              <BaseDialog.Close render={<Button size="icon" variant="ghost" aria-label="关闭"><X className="h-5 w-5" /></Button>} />
            </div>
            {children}
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

function ModerationSection({title, empty, children}: {title: string; empty: string; children: React.ReactNode}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <section><h2 className="mb-2 border-b border-slate-300 pb-2 text-sm font-bold text-slate-900">{title}</h2>{hasChildren ? children : <p className="py-4 text-sm text-slate-500">{empty}</p>}</section>;
}

function ModerationItem({title, category, author, time, body, images, onApprove, onReject, onHide}: {title: string; category: string; author: string; time: string; body: string; images: string[]; onApprove: () => void; onReject: () => void; onHide: () => void}) {
  return (
    <article className="border-b border-slate-200 py-5 last:border-0">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><span className="rounded bg-slate-100 px-2 py-1 font-semibold">{category}</span><span>{author}</span><span>{time}</span></div>
      <h3 className="mt-2 text-base font-bold text-slate-950">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{body}</p>
      <ImageStrip images={images} compact />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={onApprove} variant="primary" size="sm"><Check className="h-3.5 w-3.5" />通过</Button>
        <Button onClick={onReject} size="sm"><ThumbsDown className="h-3.5 w-3.5" />拒绝</Button>
        <Button onClick={onHide} variant="danger" size="sm"><Flag className="h-3.5 w-3.5" />隐藏</Button>
      </div>
    </article>
  );
}
