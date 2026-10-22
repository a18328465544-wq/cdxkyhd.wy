import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { performanceSample, registerPerformanceRoutes } from "./performanceRoutes.js";

test("performance samples discard identities and reject arbitrary paths and invalid numbers", () => {
  const input = { path: "/tools", name: "LCP", value: 1200, device: "mobile", phone: "private", url: "?sn=private" };
  assert.deepEqual(performanceSample(input), { path: "/tools", name: "LCP", value: 1200, device: "mobile" });
  for (const patch of [{ path: "/community/manage" }, { path: "/tools?sn=test" }, { value: Infinity }, { value: -1 }, { value: "2" }, { name: "PV" }]) assert.equal(performanceSample({ ...input, ...patch }), null);
});

test("performance endpoint accepts same-origin numeric samples without exposing a read API", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "cdweb-vitals-"));
  const app = express(); app.use(express.json()); registerPerformanceRoutes(app, dir, "https://cdgpu.cn");
  const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const body = JSON.stringify({ path: "/", name: "CLS", value: 0.01, device: "desktop", phone: "secret" });
  try {
    assert.equal((await fetch(`${base}/api/performance`, { method: "POST", body, headers: { "content-type": "application/json", origin: "https://evil.test" } })).status, 403);
    assert.equal((await fetch(`${base}/api/performance`, { method: "POST", body, headers: { "content-type": "application/json", origin: "https://cdgpu.cn" } })).status, 204);
    const saved = await readFile(path.join(dir, `vitals-${new Date().toISOString().slice(0, 10)}.jsonl`), "utf8");
    assert.equal(saved.includes("secret"), false);
    assert.equal(JSON.parse(saved).value, 0.01);
    assert.equal((await fetch(`${base}/api/performance`)).status, 404);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); await rm(dir, { recursive: true, force: true }); }
});
