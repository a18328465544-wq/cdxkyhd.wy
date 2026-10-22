import assert from "node:assert/strict";
import test from "node:test";
import { createErpCatalogService } from "./erpCatalogService.js";

test("ERP GET deduplicates only pending work, never writes or settled inventory reads", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls++;
    assert.ok(options?.signal);
    await new Promise(resolve => setTimeout(resolve, 10));
    return Response.json({ call: calls });
  };
  try {
    const service = createErpCatalogService({ baseUrl: "http://erp.test" });
    const [one, two] = await Promise.all([service.requestErpOpen("/inventory"), service.requestErpOpen("/inventory")]);
    assert.deepEqual(one, two);
    assert.equal(calls, 1);
    await service.requestErpOpen("/inventory");
    assert.equal(calls, 2);
    await Promise.all([service.requestErpOpen("/write", { method: "POST" }), service.requestErpOpen("/write", { method: "POST" })]);
    assert.equal(calls, 4);
    globalThis.fetch = async () => { calls++; throw new Error("offline"); };
    await assert.rejects(service.requestErpOpen("/inventory"));
    await assert.rejects(service.requestErpOpen("/inventory"));
    assert.equal(calls, 6);
  } finally { globalThis.fetch = original; }
});
