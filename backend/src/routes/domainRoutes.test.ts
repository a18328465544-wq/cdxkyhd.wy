import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import express from "express";
import test from "node:test";
import { registerCatalogRoutes } from "./catalogRoutes.js";
import { registerGpuSnRoutes } from "./gpuSnRoutes.js";
import { registerHealthRoutes } from "./healthRoutes.js";
import { registerPcBuilderRoutes } from "./pcBuilderRoutes.js";
import { registerGpuRankingRoutes } from "./gpuRankingRoutes.js";
import type { GpuPrice, InventoryItem } from "../types/catalog.js";
import type { ErpInventoryCard } from "../types/erpCatalog.js";

test("ranking route returns source configuration during cold starts and preserves stale snapshots with failure status", async () => {
  const app = express();
  let snapshot: { checkedAt: string } | null = null;
  let refreshes = 0;
  const source = {
    getSnapshot: () => snapshot,
    refresh: () => { refreshes += 1; },
    getStatus: () => ({ configured: false, reason: "等待数据源", refreshFailed: true }),
  };
  registerGpuRankingRoutes(app, { gpu: source, blender: source, geekbench: source, threeDMark: source, refreshIntervals: { gpu: 1000, blender: 1000, geekbench: 1000, threeDMark: 1000 } });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const cold = await fetch(`${baseUrl}/api/gpu-ranking`);
    assert.equal(cold.status, 200);
    const body = await cold.json() as { success: boolean; syncing: boolean; threeDMarkStatus: { reason: string } };
    assert.equal(body.success, true);
    assert.equal(body.syncing, true);
    assert.equal(body.threeDMarkStatus.reason, "等待数据源");
    assert.equal(refreshes, 4);
    snapshot = { checkedAt: "2020-01-01T00:00:00Z" };
    const stale = await readJson<{ snapshot: { checkedAt: string }; gamingStatus: { refreshFailed: boolean }; blenderStatus: { refreshFailed: boolean } }>(`${baseUrl}/api/gpu-ranking`);
    assert.deepEqual(stale.snapshot, snapshot);
    assert.equal(stale.gamingStatus.refreshFailed, true);
    assert.equal(stale.blenderStatus.refreshFailed, true);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  return await response.json() as T;
}

test("domain route groups preserve the website API contracts", async () => {
  const app = express();
  app.use(express.json());
  registerHealthRoutes(app, "connected");
  registerGpuSnRoutes(app);

  let inventory: InventoryItem[] = [
    { id: "gpu-1", name: "NVIDIA RTX 5090", category: "GPU", price: 1000, quantity: 5, condition: "全新", specs: "32GB", status: "有货", wattage: 450 },
    { id: "psu-1", name: "1000W 电源", category: "PSU", price: 500, quantity: 4, condition: "全新", specs: "1000W", status: "有货", wattage: 1000 },
  ];
  const prices: GpuPrice[] = [{ name: "RTX 5090", category: "gaming", basePrice: "1000", trend: "stable", specs: { vram: "32GB", tdp: "450W" } }];
  const erp = {
    fetchStockedInventoryItems: async () => [],
    fetchMarketQuotes: async () => [],
    fetchInventorySummary: async () => [],
    findProductIdByName: async () => undefined,
    mapCardToInventoryItem: () => inventory[0],
    mapMarketQuoteToGpuPrice: () => prices[0],
    mapSummaryToInventoryItem: () => inventory[0],
    mapInventoryToGpuPrice: () => prices[0],
    request: async () => ({}),
  };
  registerCatalogRoutes(app, {
    erpConnected: false,
    inventory: { get: () => inventory, replace: (next) => { inventory = next; } },
    prices: { get: () => prices },
    erp,
  });
  registerPcBuilderRoutes(app, {
    erpConnected: false,
    getInventory: () => inventory,
    fetchErpParts: async () => [],
    replaceInventory: (next) => { inventory = next; },
  });

  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const health = await readJson<{ status: string; erpMode: string }>(`${baseUrl}/api/health`);
    assert.equal(health.status, "ok");
    assert.equal(health.erpMode, "connected");

    const stock = await readJson<{ count: number; items: InventoryItem[] }>(`${baseUrl}/api/inventory?category=GPU`);
    assert.equal(stock.count, 1);
    assert.equal(stock.items[0].id, "gpu-1");

    const parts = await readJson<{ parts: InventoryItem[] }>(`${baseUrl}/api/pc-parts`);
    assert.equal(parts.parts.length, 2);

    const build = await readJson<{ totalPrice: number; totalWattageNeed: number; selectedSummary: { gpu: string } }>(`${baseUrl}/api/pc-builder/build`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ gpuId: "gpu-1", psuId: "psu-1" }),
    });
    assert.equal(build.totalPrice, 1500);
    assert.equal(build.totalWattageNeed, 475);
    assert.equal(build.selectedSummary.gpu, "NVIDIA RTX 5090");

    const rules = await readJson<{ success: boolean; data: unknown[] }>(`${baseUrl}/api/gpu-sn/rules`);
    assert.equal(rules.success, true);
    assert.ok(Array.isArray(rules.data));
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("catalog routes keep inventory and stock operations on the ERP adapter", async () => {
  const app = express();
  app.use(express.json());
  const mappedItem: InventoryItem = {
    id: "erp-item-1",
    name: "ERP 显卡",
    category: "GPU",
    price: 2400,
    quantity: 1,
    condition: "99新",
    specs: "库存档案",
    status: "有货",
  };
  const erpCard: ErpInventoryCard = { id: "erp-item-1", productName: "ERP 显卡", status: "已入库" };
  const price: GpuPrice = { name: "ERP 显卡", category: "gaming", basePrice: "2400", trend: "stable", specs: { vram: "16GB", tdp: "250W" } };
  const stockRequests: Array<{ path: string; body: unknown }> = [];

  registerCatalogRoutes(app, {
    erpConnected: true,
    inventory: { get: () => [mappedItem], replace: () => undefined },
    prices: { get: () => [] },
    erp: {
      fetchStockedInventoryItems: async () => [erpCard],
      fetchMarketQuotes: async () => [{ model: "ERP 显卡", refBuyPrice: 2400 }],
      fetchInventorySummary: async () => [],
      findProductIdByName: async () => "erp-product-1",
      mapCardToInventoryItem: () => mappedItem,
      mapMarketQuoteToGpuPrice: () => price,
      mapSummaryToInventoryItem: () => mappedItem,
      mapInventoryToGpuPrice: () => price,
      request: async (pathname, options) => {
        stockRequests.push({ path: pathname, body: options?.body });
        return { accepted: true };
      },
    },
  });

  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const stock = await readJson<{ source: string; items: InventoryItem[] }>(`${baseUrl}/api/inventory`);
    assert.equal(stock.source, "erp-open-api");
    assert.equal(stock.items[0].id, "erp-item-1");

    const prices = await readJson<{ source: string; prices: GpuPrice[] }>(`${baseUrl}/api/prices`);
    assert.equal(prices.source, "erp-open-api:market-quotes");
    assert.equal(prices.prices[0].name, "ERP 显卡");

    const update = await readJson<{ success: boolean }>(`${baseUrl}/api/inventory/update-stock`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sn: "SN-001", mode: "出库" }),
    });
    assert.equal(update.success, true);
    assert.equal(stockRequests[0].path, "/inventory/scan-out");
    assert.deepEqual(stockRequests[0].body, { sn: "SN-001", handler: "网站API", warehouseLocation: undefined });
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
