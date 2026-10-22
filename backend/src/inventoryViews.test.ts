import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { registerCatalogRoutes } from "./routes/catalogRoutes.js";
import { registerPcBuilderRoutes } from "./routes/pcBuilderRoutes.js";
import type { InventoryItem } from "./types/catalog.js";
import { inventoryPagination } from "./inventoryViews.js";

test("inventory pagination rejects unbounded and structured input", () => {
  for (const query of [{ page: "0" }, { page: "1.5" }, { pageSize: "51" }, { page: ["2"] }, { pageSize: {} }]) assert.equal(inventoryPagination(query), null);
  assert.deepEqual(inventoryPagination({}), { page: 1, pageSize: 9 });
});

test("list paging keeps all ERP flags, detail restores full specs, and filtered reads do not replace builder stock", async () => {
  const stock: InventoryItem[] = Array.from({ length: 12 }, (_, i) => ({ id: `gpu-${i}`, name: `RTX 5090 ${i}`, category: "GPU", price: i, quantity: 1, condition: "99新", categoryLabel: "显卡", fullBox: false, inWarranty: true, repaired: false, gpuRisk: true, status: "已上架", specs: `32GB | SN-${i} | warehouse`, publicSpecs: "32GB", warehouseLocation: "A1", wattage: 600 }));
  const app = express();
  let replacements = 0;
  let partsStock = stock;
  registerCatalogRoutes(app, {
    erpConnected: true, inventory: { get: () => stock, replace: () => { replacements++; } }, prices: { get: () => [] },
    erp: { fetchStockedInventoryItems: async query => { if (query.view === "list") assert.equal(query.search, undefined); return stock; }, fetchMarketQuotes: async () => [], fetchInventorySummary: async () => [], findProductIdByName: async () => undefined, mapCardToInventoryItem: card => stock.find(item => item.id === card.id)!, mapMarketQuoteToGpuPrice: () => { throw new Error("not used"); }, mapSummaryToInventoryItem: () => stock[0], mapInventoryToGpuPrice: () => { throw new Error("not used"); }, request: async () => ({}) },
  });
  registerPcBuilderRoutes(app, { erpConnected: true, getInventory: () => partsStock, fetchErpParts: async () => [], replaceInventory: items => { partsStock = items; } });
  const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const get = async (query: string) => (await fetch(`${base}/api/inventory?${query}`)).json() as Promise<{ totalCount: number; count: number; page: number; totalPages: number; items: InventoryItem[] }>;
  try {
    const list = await get("view=list&category=GPU&page=1&pageSize=9");
    assert.equal(list.totalCount, 12); assert.equal(list.count, 9); assert.equal(list.totalPages, 2);
    assert.equal(list.items[0].fullBox, false); assert.equal(list.items[0].gpuRisk, true); assert.equal(list.items[0].inWarranty, true); assert.equal(list.items[0].price, 0);
    assert.equal(list.items[0].condition, "99新"); assert.equal(list.items[0].status, "已上架");
    assert.equal("specs" in list.items[0], false); assert.equal("warehouseLocation" in list.items[0], false);
    const next = await get("view=list&category=GPU&page=2&pageSize=9");
    assert.deepEqual(next.items.map((item: InventoryItem) => item.id), ["gpu-9", "gpu-10", "gpu-11"]);
    const search = await get("view=list&category=GPU&search=SN-11&page=90");
    assert.equal(search.totalCount, 1); assert.equal(search.page, 1);
    const detail = await get("detailId=gpu-11");
    assert.equal(detail.items[0].warehouseLocation, "A1"); assert.match(detail.items[0].specs, /SN-11/);
    assert.equal((await fetch(`${base}/api/inventory?detailId=missing`)).status, 404);
    const available = await get("view=availability&category=GPU");
    assert.equal(available.items[0].specs, "32GB"); assert.equal("fullBox" in available.items[0], false);
    assert.equal(replacements, 0);
    assert.equal((await fetch(`${base}/api/inventory?view=list&pageSize=1000`)).status, 400);
    await fetch(`${base}/api/pc-parts?view=picker`);
    assert.deepEqual(partsStock, []);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
