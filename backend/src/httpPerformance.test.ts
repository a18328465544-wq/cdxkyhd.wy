import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { registerHttpPerformance, registerStaticFiles } from "./httpPerformance.js";

test("compresses public text, keeps private APIs no-store, and caches only fingerprinted assets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "cdweb-http-"));
  await mkdir(path.join(root, "assets"));
  await mkdir(path.join(root, "retained"));
  const content = "export const value = 'performance';\n".repeat(200);
  await writeFile(path.join(root, "assets/main-12345678.js"), content);
  await writeFile(path.join(root, "retained/old-abcdefgh.js"), content);
  await writeFile(path.join(root, "index.html"), "<html>new shell</html>");
  const app = express();
  registerHttpPerformance(app);
  app.get("/api/public", (_req, res) => res.json({ value: content }));
  app.get("/api/forum/me", (_req, res) => { res.cookie("session", "test"); res.json({ value: content }); });
  registerStaticFiles(app, root, path.join(root, "retained"));
  app.get("*", (_req, res) => res.type("html").send("shell"));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    for (const encoding of ["gzip", "br"]) {
      const response = await fetch(`${base}/assets/main-12345678.js`, { headers: { "accept-encoding": encoding } });
      assert.equal(response.headers.get("content-encoding"), encoding);
      assert.match(response.headers.get("cache-control")!, /max-age=31536000.*immutable/);
      assert.equal(await response.text(), content);
      const revalidation = { cache: "no-cache", headers: { "if-none-match": response.headers.get("etag")! } };
      const cached = await fetch(`${base}/assets/main-12345678.js`, revalidation);
      assert.equal(cached.status, 304);
    }
    const api = await fetch(`${base}/api/public`, { headers: { "accept-encoding": "gzip" } });
    assert.equal(api.headers.get("content-encoding"), "gzip");
    assert.equal(api.headers.get("cache-control"), "no-store");
    const privateApi = await fetch(`${base}/api/forum/me`);
    assert.equal(privateApi.headers.get("content-encoding"), null);
    assert.equal(privateApi.headers.get("cache-control"), "no-store");
    assert.equal(await (await fetch(`${base}/assets/old-abcdefgh.js`)).text(), content);
    assert.equal((await fetch(`${base}/assets/missing-12345678.js`)).status, 404);
    assert.equal((await fetch(`${base}/assets/.env`)).status, 404);
    assert.equal((await fetch(base)).headers.get("cache-control"), "no-cache");
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); await rm(root, { recursive: true, force: true }); }
});
