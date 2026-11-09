import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createForumSessionToken } from "../forumSecurity.js";
import { registerConversionRoutes } from "./conversionRoutes.js";

test("conversion counts store only approved event totals and require the forum admin session to read", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "cdweb-conversions-"));
  const secret = "test-session-secret-with-more-than-32-bytes";
  const app = express();
  app.use(express.json());
  registerConversionRoutes(app, directory, secret);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const adminToken = createForumSessionToken({ sub: "forum-admin", role: "admin", exp: Math.floor(Date.now() / 1000) + 60 }, secret);
  try {
    const denied = await fetch(`${base}/api/conversions/summary`);
    assert.equal(denied.status, 401);

    for (const event of ["wechat_estimate", "product_inquiry", "phone_click"] as const) {
      const response = await fetch(`${base}/api/conversions`, {
        method: "POST", headers: { origin: base, "content-type": "application/json" }, body: JSON.stringify({ event }),
      });
      assert.equal(response.status, 204);
    }
    const invalid = await fetch(`${base}/api/conversions`, {
      method: "POST", headers: { origin: base, "content-type": "application/json" }, body: JSON.stringify({ event: "phone_click", phone: "17608075394" }),
    });
    assert.equal(invalid.status, 400);

    const summary = await fetch(`${base}/api/conversions/summary?days=7`, { headers: { cookie: `forum_admin_session=${adminToken}` } });
    assert.equal(summary.status, 200);
    const summaryBody = await summary.json() as { counts: Record<string, number> };
    assert.deepEqual(summaryBody.counts, { wechat_estimate: 1, product_inquiry: 1, phone_click: 1 });
    assert.equal(summary.headers.get("cache-control"), "no-store");

    const stored = await readFile(path.join(directory, "conversion-counts.json"), "utf8");
    assert.doesNotMatch(stored, /17608075394|127\.0\.0\.1|user-agent/i);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});

test("conversion endpoint rejects cross-origin writes", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "cdweb-conversions-origin-"));
  const app = express();
  app.use(express.json());
  registerConversionRoutes(app, directory, "test-session-secret-with-more-than-32-bytes");
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const response = await fetch(`${base}/api/conversions`, {
      method: "POST", headers: { origin: "https://attacker.example", "content-type": "application/json" }, body: JSON.stringify({ event: "phone_click" }),
    });
    assert.equal(response.status, 403);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});
