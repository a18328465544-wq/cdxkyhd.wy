import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { runInNewContext } from "node:vm";
import express from "express";
import { CONTACT_INFO } from "@cdxkyhd/shared";
import { createErpCatalogService } from "../services/erpCatalogService.js";
import { registerMiniprogramRoutes } from "./miniprogramRoutes.js";

type ProductResponse = {
  source: string;
  data: Array<{ id: string; priceLow: number | null; availableQuantity: number; conditionLevel: string; repaired: boolean | null; gpuRisk: boolean | null; fullBox: boolean | null; inWarranty: boolean | null }>;
  categories: Array<{ key: string }>;
};
type PricesResponse = { source: string; data: Array<{ recyclePriceLow: number | null; date: string | null }> };
type FailureResponse = { success: boolean; data?: unknown };

async function serve(app: ReturnType<typeof express>) {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

test("mini-program follows the real ERP adapter and only returns customer fields", async () => {
  const upstream = express();
  const calls: Array<{ path: string; query: Record<string, unknown>; authorization: string | undefined }> = [];
  upstream.use((req, _res, next) => {
    calls.push({ path: req.path, query: req.query, authorization: req.get("authorization") });
    next();
  });
  upstream.get("/api/open/prices/market-quotes", (_req, res) => res.json({ data: [
    { id: "q1", model: "RTX 3090", brand: "测试品牌", refBuyPrice: 2400, refSellPrice: 2800, updateTime: "2026-10-20", costPrice: 1234 },
    { id: "q2", model: "RTX 4090", refBuyPrice: 5000, refSellPrice: 0 },
    { id: "q3", model: "No quote", refBuyPrice: 0, refSellPrice: 0 },
    { id: "q4", model: "Sale only", refBuyPrice: 0, refSellPrice: 3000 },
  ] }));
  upstream.get("/api/open/inventory/items", (req, res) => res.json({ data: req.query.status === "已入库" ? [
    { id: "card1", productId: "p1", category: "显卡", productName: "测试显卡", status: "已入库", estSellPrice: 2800, costPrice: 1234, sn: "PRIVATE-SN", supplierName: "PRIVATE-SUPPLIER", remarks: "PRIVATE-NOTES", repaired: true, gpuRisk: true, fullBox: false },
    { id: "sold", category: "显卡", status: "已售出", estSellPrice: 4000 },
    { id: "operation", category: "组装拆卸", status: "已入库" },
    { id: "unpriced", category: "显卡", status: "已入库", estSellPrice: 0 },
  ] : [] }));
  const erpServer = await serve(upstream);
  const app = express();
  registerMiniprogramRoutes(app, {
    erpConnected: true, erp: createErpCatalogService({ baseUrl: erpServer.url, apiKey: "test-server-only-key" }),
  });
  const server = await serve(app);
  try {
    const prices = await (await fetch(`${server.url}/api/miniprogram/market-prices?q=RTX`)).json() as PricesResponse;
    assert.equal(prices.source, "erp-open-api:market-quotes");
    assert.equal(prices.data.length, 2);
    assert.equal(prices.data[0].recyclePriceLow, 2400);
    assert.ok(prices.data.every((row) => !("salePriceLow" in row) && !("salePriceHigh" in row)));
    assert.equal(prices.data[0].date, "2026-10-20");
    assert.equal(prices.data[1].recyclePriceLow, 5000);
    assert.equal(prices.data[1].date, null);
    assert.equal(calls[0].query.q, "RTX");
    assert.equal(calls[0].authorization, "Bearer test-server-only-key");

    const response = await fetch(`${server.url}/api/miniprogram/products?category=GPU&q=测试`);
    const stock = await response.json() as ProductResponse;
    stock.data.sort((a, b) => a.id.localeCompare(b.id));
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(stock.data.map((row: { id: string }) => row.id), ["card1", "unpriced"]);
    assert.equal(stock.data[0].priceLow, 2800);
    assert.equal(stock.data[0].availableQuantity, 1);
    assert.equal(stock.data[0].conditionLevel, "未标注");
    assert.equal(stock.data[0].repaired, true);
    assert.equal(stock.data[0].gpuRisk, true);
    assert.equal(stock.data[0].fullBox, false);
    assert.equal(stock.data[0].inWarranty, null);
    assert.equal(stock.data[1].priceLow, null);
    assert.equal(stock.categories.length, 11);
    assert.ok(!stock.categories.some((row: { key: string }) => ["All", "Assembly"].includes(row.key)));
    const inventoryCalls = calls.filter((call) => call.path.endsWith("/inventory/items"));
    assert.deepEqual(inventoryCalls.map((call) => call.query.status), ["已入库", "已上架"]);
    assert.equal(inventoryCalls[0].query.category, "显卡");
    assert.equal(inventoryCalls[0].query.keyword, "测试");
    for (const forbidden of ["costPrice", "sn", "supplierName", "remarks", "PRIVATE-", "test-server-only-key"]) {
      assert.ok(!JSON.stringify({ prices, stock }).includes(forbidden), forbidden);
    }
    const detail = await (await fetch(`${server.url}/api/miniprogram/products?id=card1`)).json() as ProductResponse;
    assert.equal(detail.data.length, 1);
    assert.equal(detail.data[0].id, "card1");
    const missing = await (await fetch(`${server.url}/api/miniprogram/products?id=sold`)).json() as ProductResponse;
    assert.deepEqual(missing.data, []);
    const invalid = await fetch(`${server.url}/api/miniprogram/products?category=Assembly`);
    assert.equal(invalid.status, 400);
  } finally {
    await server.close();
    await erpServer.close();
  }
});

test("disconnected ERP cannot serve mock prices, while real store contact remains available", async () => {
  const app = express();
  const erp = createErpCatalogService({});
  registerMiniprogramRoutes(app, { erpConnected: false, erp });
  const server = await serve(app);
  try {
    for (const path of ["market-prices", "products"]) {
      const response = await fetch(`${server.url}/api/miniprogram/${path}`);
      const body = await response.json() as FailureResponse;
      assert.equal(response.status, 503);
      assert.equal(body.success, false);
      assert.equal(body.data, undefined);
    }
    const contact = await (await fetch(`${server.url}/api/miniprogram/contact`)).json() as { data: typeof CONTACT_INFO & { inquirySubmissionAvailable: boolean } };
    assert.equal(contact.data.phoneDisplay, CONTACT_INFO.phoneDisplay);
    assert.equal(contact.data.wechatId, CONTACT_INFO.wechatId);
    assert.equal(contact.data.inquirySubmissionAvailable, false);
  } finally { await server.close(); }
});

test("upstream errors are never returned as customer data or leaked to the mini-program", async () => {
  const app = express();
  const erp = createErpCatalogService({});
  registerMiniprogramRoutes(app, { erpConnected: true, erp: {
    ...erp,
    fetchErpMarketQuotes: async () => { throw new Error("test upstream unavailable"); },
    fetchErpStockedInventoryItems: async () => { throw new Error("test upstream unavailable"); },
  } });
  const server = await serve(app);
  try {
    for (const path of ["market-prices", "products"]) {
      const response = await fetch(`${server.url}/api/miniprogram/${path}`);
      const body = await response.json() as FailureResponse;
      assert.equal(response.status, 502);
      assert.equal(body.success, false);
      assert.ok(!JSON.stringify(body).includes("test upstream unavailable"));
    }
  } finally { await server.close(); }
});

test("mini-program rejects HTTP 200 HTML and unsuccessful envelopes", async () => {
  const code = await readFile(new URL("../../../miniprogram/utils/request.js", import.meta.url), "utf8");
  let response: { statusCode: number; data: unknown };
  const module = { exports: {} as { request?: (input: { path: string }) => Promise<unknown> } };
  runInNewContext(code, {
    module, require: () => ({ API_BASE_URL: "http://127.0.0.1:3311/" }),
    wx: { request(options: { url: string; success: (value: unknown) => void }) {
      assert.equal(options.url, "http://127.0.0.1:3311/api/miniprogram/products");
      options.success(response);
    } },
  });
  for (const body of ["<!doctype html>", { success: false }, {}]) {
    response = { statusCode: 200, data: body };
    await assert.rejects(module.exports.request!({ path: "/api/miniprogram/products" }));
  }
  response = { statusCode: 200, data: { success: true, data: [] } };
  assert.deepEqual(await module.exports.request!({ path: "/api/miniprogram/products" }), response.data);
});
