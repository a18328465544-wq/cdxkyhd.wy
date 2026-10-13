import assert from "node:assert/strict";
import {mkdtemp, rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {once} from "node:events";
import type {AddressInfo} from "node:net";
import express from "express";
import test from "node:test";
import {createForumRouter} from "./forumRoutes.js";
import {ForumStore} from "./forumStore.js";

test("forum requires verified sessions and moderation before public display", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "cdx-forum-routes-"));
  context.after(() => rm(directory, {recursive: true, force: true}));
  const store = await ForumStore.open(directory);
  const products = [{id: "gpu-5090", name: "RTX 5090 32G", category: "GPU", condition: "全新", stockStatus: "有货"}];
  const app = express();
  app.use(express.json());
  app.use("/api/forum", createForumRouter({
    store,
    dataDirectory: directory,
    sessionSecret: "session-secret-value-long-enough-for-this-test",
    adminPassword: "admin-password-long-enough",
    isProduction: false,
    findProducts: async (query) => products.filter((item) => item.id.includes(query) || item.name.includes(query)),
  }));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(async () => {
    server.close();
    await once(server, "close");
  });
  const address = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${address.port}`;
  const request = async (url: string, options: {method?: string; body?: unknown; cookie?: string} = {}) => {
    const response = await fetch(`${base}${url}`, {
      method: options.method || "GET",
      headers: {
        ...(options.body === undefined ? {} : {"content-type": "application/json"}),
        ...(options.cookie ? {cookie: options.cookie} : {}),
      },
      ...(options.body === undefined ? {} : {body: JSON.stringify(options.body)}),
    });
    const data = await response.json() as Record<string, any>;
    const setCookie = response.headers.get("set-cookie");
    return {status: response.status, data, cookie: setCookie?.split(";")[0] || options.cookie || ""};
  };

  assert.equal((await request("/api/forum/meta")).data.authReady, true);
  assert.equal((await request("/api/forum/auth/register", {method: "POST", body: {username: "bad", password: "short", nickname: "玩家"}})).status, 400);
  assert.equal((await request("/api/forum/posts", {method: "POST", body: {title: "游客帖子", body: "未登录的内容"}})).status, 401);

  const registered = await request("/api/forum/auth/register", {method: "POST", body: {username: "GPU_Fan", password: "secure-password-123", nickname: "显卡玩家"}});
  assert.equal(registered.status, 201);
  assert.equal((await request("/api/forum/auth/register", {method: "POST", body: {username: "gpu_fan", password: "another-password-123", nickname: "其他玩家"}})).status, 409);
  assert.equal((await request("/api/forum/auth/login", {method: "POST", body: {username: "gpu_fan", password: "wrong-password-123"}})).status, 401);
  assert.equal((await request("/api/forum/auth/login", {method: "POST", body: {username: "unknown", password: "wrong-password-123"}})).status, 401);
  const login = await request("/api/forum/auth/login", {method: "POST", body: {username: "GPU_FAN", password: "secure-password-123"}});
  assert.equal(login.status, 200);
  const userCookie = login.cookie;
  assert.match(userCookie, /^forum_session=/);
  assert.equal(JSON.stringify(store.snapshot()).includes("secure-password-123"), false);
  assert.match(store.snapshot().users[0].passwordHash || "", /^scrypt\$/);

  const created = await request("/api/forum/posts", {
    method: "POST",
    cookie: userCookie,
    body: {
      title: "RTX 5090 装机电源怎么选",
      body: "准备使用这张显卡做本地模型推理，想了解电源和机箱散热应该注意什么。",
      category: "build",
      tags: ["显卡", "电源"],
      productId: "gpu-5090",
      attachmentIds: [],
    },
  });
  assert.equal(created.status, 201);
  const postId = created.data.postId as string;
  assert.equal(created.data.status, "pending");
  assert.equal((await request("/api/forum/posts")).data.total, 0);

  const adminLogin = await request("/api/forum/admin/login", {method: "POST", body: {password: "admin-password-long-enough"}});
  assert.equal(adminLogin.status, 200);
  const adminCookie = adminLogin.cookie;
  assert.match(adminCookie, /^forum_admin_session=/);
  const combinedCookies = `${userCookie}; ${adminCookie}`;
  assert.equal((await request("/api/forum/auth/me", {cookie: combinedCookies})).data.user.nickname, "显卡玩家");
  assert.equal((await request("/api/forum/admin/session", {cookie: combinedCookies})).data.authenticated, true);
  const queue = await request("/api/forum/admin/queue", {cookie: combinedCookies});
  assert.equal(queue.data.posts.length, 1);
  assert.equal(queue.data.posts[0].id, postId);
  assert.equal((await request(`/api/forum/admin/posts/${postId}`, {method: "PATCH", cookie: combinedCookies, body: {status: "approved"}})).status, 200);

  const publicList = await request("/api/forum/posts");
  assert.equal(publicList.data.total, 1);
  assert.equal(publicList.data.posts[0].product.name, products[0].name);
  const reply = await request(`/api/forum/posts/${postId}/replies`, {method: "POST", cookie: userCookie, body: {body: "建议选择 ATX 3.1 并给功耗留出余量。"}});
  assert.equal(reply.status, 201);
  assert.equal((await request(`/api/forum/posts/${postId}`)).data.post.replies.length, 0);
  const replyQueue = await request("/api/forum/admin/queue", {cookie: combinedCookies});
  assert.equal(replyQueue.data.replies.length, 1);
  const replyId = replyQueue.data.replies[0].id as string;
  assert.equal((await request(`/api/forum/admin/replies/${replyId}`, {method: "PATCH", cookie: combinedCookies, body: {status: "approved"}})).status, 200);
  assert.equal((await request(`/api/forum/posts/${postId}`)).data.post.replies.length, 1);

  const report = await request(`/api/forum/posts/${postId}/reports`, {method: "POST", cookie: userCookie, body: {reason: "其他", details: "需要管理员查看"}});
  assert.equal(report.status, 201);
  assert.equal((await request(`/api/forum/posts/${postId}/reports`, {method: "POST", cookie: userCookie, body: {reason: "其他"}})).status, 409);
  const replyReport = await request(`/api/forum/replies/${replyId}/reports`, {method: "POST", cookie: userCookie, body: {reason: "虚假或误导内容"}});
  assert.equal(replyReport.status, 201);
  const reportQueue = await request("/api/forum/admin/queue", {cookie: combinedCookies});
  assert.equal(reportQueue.data.reports.length, 2);
  const replyReportId = reportQueue.data.reports.find((item: {targetType: string}) => item.targetType === "reply").id as string;
  assert.equal((await request(`/api/forum/admin/reports/${replyReportId}`, {method: "PATCH", cookie: combinedCookies, body: {status: "actioned"}})).status, 200);
  assert.equal((await request(`/api/forum/posts/${postId}`)).data.post.replies.length, 0);

  const adminLogout = await request("/api/forum/admin/logout", {method: "POST", cookie: combinedCookies});
  assert.match(adminLogout.cookie, /^forum_admin_session=/);
  assert.equal((await request("/api/forum/admin/session", {cookie: userCookie})).data.authenticated, false);
  assert.equal((await request("/api/forum/posts", {
    method: "POST",
    cookie: userCookie,
    body: {title: "用户会话仍然有效", body: "退出管理员不应退出普通用户，用户登录状态应当继续保留。", category: "gpu", tags: [], attachmentIds: []},
  })).status, 201);
});

