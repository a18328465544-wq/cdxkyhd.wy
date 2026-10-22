import assert from "node:assert/strict";
import test from "node:test";
import { apiFetch } from "./api";

test("API requests preserve caller headers, avoid GET preflight headers and propagate cancellation", async () => {
  const previous = globalThis.fetch;
  const external = new AbortController();
  try {
    globalThis.fetch = async (_url, options) => {
      assert.equal(new Headers(options?.headers).get("content-type"), null);
      assert.equal(new Headers(options?.headers).get("x-test"), "preserved");
      return Response.json({ success: true });
    };
    assert.deepEqual(await apiFetch("/api/test", { headers: new Headers({ "x-test": "preserved" }) }), { success: true });
    globalThis.fetch = async (_url, options) => {
      assert.equal(new Headers(options?.headers).get("content-type"), "application/json");
      return Response.json({ success: true });
    };
    await apiFetch("/api/test", { method: "POST", body: "{}" });
    globalThis.fetch = async (_url, options) => new Promise<Response>((_resolve, reject) => { options?.signal?.addEventListener("abort", () => reject(options.signal?.reason), { once: true }); });
    const pending = apiFetch("/api/test", { signal: external.signal });
    external.abort();
    await assert.rejects(pending, { name: "AbortError" });
  } finally { globalThis.fetch = previous; }
});
