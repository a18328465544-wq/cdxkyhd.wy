import type { Express } from "express";
import { buildInventoryCategories } from "../inventoryCategories.js";
import { inventoryAvailability, inventoryListItem, inventoryPagination, publicInventoryItem } from "../inventoryViews.js";
import type { GpuPrice, InventoryItem } from "../types/catalog.js";
import type { ErpInventoryCard, ErpInventorySummaryRow, ErpMarketQuote, ErpQueryValue } from "../types/erpCatalog.js";

interface CatalogRouteDependencies {
  erpConnected: boolean;
  inventory: {
    get(): InventoryItem[];
    replace(items: InventoryItem[]): void;
  };
  prices: {
    get(): GpuPrice[];
  };
  erp: {
    fetchStockedInventoryItems(query: Record<string, ErpQueryValue>): Promise<ErpInventoryCard[]>;
    fetchMarketQuotes(query: Record<string, ErpQueryValue>): Promise<ErpMarketQuote[]>;
    fetchInventorySummary(query: Record<string, ErpQueryValue>): Promise<ErpInventorySummaryRow[]>;
    findProductIdByName(name: string): Promise<string | undefined>;
    mapCardToInventoryItem(card: ErpInventoryCard): InventoryItem;
    mapMarketQuoteToGpuPrice(quote: ErpMarketQuote, index: number): GpuPrice;
    mapSummaryToInventoryItem(row: ErpInventorySummaryRow): InventoryItem;
    mapInventoryToGpuPrice(item: InventoryItem, index: number): GpuPrice;
    request(pathname: string, options?: { method?: string; query?: URLSearchParams; body?: unknown }): Promise<unknown>;
  };
}

export function registerCatalogRoutes(app: Express, dependencies: CatalogRouteDependencies) {
  const { erpConnected, inventory, prices, erp } = dependencies;

  app.get("/api/inventory", async (req, res) => {
    const view = req.query.view;
    const pagination = inventoryPagination(req.query);
    if ((view !== undefined && view !== "list" && view !== "availability") || (view === "list" && !pagination)) {
      return res.status(400).json({ success: false, error: "库存查询参数无效" });
    }
    if (req.query.detailId !== undefined && (typeof req.query.detailId !== "string" || req.query.detailId.length > 200)) {
      return res.status(400).json({ success: false, error: "商品编号无效" });
    }
    const respond = (sourceItems: InventoryItem[], source?: string) => {
      const categories = buildInventoryCategories(sourceItems);
      let items = sourceItems;
      if (req.query.category && req.query.category !== "All") items = items.filter(item => item.category.toLowerCase() === String(req.query.category).toLowerCase());
      const search = String(req.query.search || "").trim().toLowerCase();
      if (search) items = items.filter(item => `${item.name} ${item.specs}`.toLowerCase().includes(search));
      if (req.query.inStock === "true") items = items.filter(item => item.quantity > 0);
      if (req.query.detailId) {
        items = items.filter(item => item.id === req.query.detailId);
        if (!items.length) return res.status(404).json({ success: false, error: "该商品已不在当前库存，请刷新库存" });
      }
      const count = items.length;
      const totalPages = pagination ? Math.max(1, Math.ceil(count / pagination.pageSize)) : 1;
      const page = pagination ? Math.min(pagination.page, totalPages) : 1;
      if (view === "list" && pagination) items = items.slice((page - 1) * pagination.pageSize, page * pagination.pageSize);
      return res.json({ success: true, source, mode: "stocked-single-items", lastUpdated: new Date().toLocaleTimeString(), totalCount: count, count: items.length, categories,
        ...(view === "list" && pagination ? { page, pageSize: pagination.pageSize, totalPages } : {}),
        items: items.map(item => view === "list" ? inventoryListItem(item) : view === "availability" ? inventoryAvailability(item) : publicInventoryItem(item)),
      });
    };
    if (erpConnected) {
      try {
        // The ERP keyword matcher is narrower than the website's substring search.
        const query = view === "list" ? { ...req.query, search: undefined, keyword: undefined } : req.query;
        const rows = await erp.fetchStockedInventoryItems(query as Record<string, ErpQueryValue>);
        const items = rows.map(erp.mapCardToInventoryItem);
        if (!req.query.category && !req.query.search && !req.query.detailId) inventory.replace(items);
        return respond(items, "erp-open-api");
      } catch (error) {
        const message = error instanceof Error ? error.message : "ERP 库存接口请求失败";
        return res.status(502).json({ success: false, error: message });
      }
    }

    return respond(inventory.get());
  });

  app.post("/api/inventory/update-stock", async (req, res) => {
    if (erpConnected) {
      const { sn, mode, handler, warehouseLocation } = req.body;
      if (!sn || (mode !== "入库" && mode !== "出库" && mode !== "移库")) {
        return res.status(400).json({
          success: false,
          error: "ERP 真实库存按 SN 扫码流转，请传入 sn 和 mode（入库/出库/移库），不能按商品型号直接增减数量。",
        });
      }
      const endpointMap: Record<string, string> = { 入库: "/inventory/scan-in", 出库: "/inventory/scan-out", 移库: "/inventory/relocate" };
      try {
        const payload = await erp.request(endpointMap[mode], {
          method: "POST",
          body: { sn, handler: handler || "网站API", warehouseLocation },
        });
        return res.json({ success: true, source: "erp-open-api", data: payload });
      } catch (error) {
        const message = error instanceof Error ? error.message : "ERP 库存流转失败";
        return res.status(502).json({ success: false, error: message });
      }
    }

    const { id, quantityChange, setQuantity } = req.body;
    const item = inventory.get().find((candidate) => candidate.id === id);
    if (!item) return res.status(404).json({ success: false, error: "未找到对应的库存配件" });

    if (typeof setQuantity === "number") item.quantity = Math.max(0, setQuantity);
    else if (typeof quantityChange === "number") item.quantity = Math.max(0, item.quantity + quantityChange);
    item.status = item.quantity === 0 ? "缺货" : item.quantity <= 3 ? "库存紧张" : "有货";

    return res.json({ success: true, message: `配件 [${item.name}] 库存已成功更新。`, updatedItem: item });
  });

  app.get("/api/prices", async (req, res) => {
    if (erpConnected) {
      try {
        const quoteRows = await erp.fetchMarketQuotes(req.query as Record<string, ErpQueryValue>);
        const marketPrices = quoteRows
          .filter((quote) => Number(quote.refBuyPrice ?? quote.todayBuyPrice ?? quote.yestBuyPrice ?? 0) > 0)
          .map(erp.mapMarketQuoteToGpuPrice);
        if (marketPrices.length > 0) {
          return res.json({
            success: true,
            source: "erp-open-api:market-quotes",
            lastUpdated: new Date().toLocaleTimeString(),
            totalCount: marketPrices.length,
            prices: marketPrices,
          });
        }

        const rows = await erp.fetchInventorySummary({ ...(req.query as Record<string, ErpQueryValue>), category: "GPU" });
        const fallbackPrices = rows
          .map(erp.mapSummaryToInventoryItem)
          .filter((item) => item.category === "GPU")
          .sort((a, b) => b.quantity - a.quantity || b.price - a.price)
          .map(erp.mapInventoryToGpuPrice);
        return res.json({
          success: true,
          source: "erp-open-api:inventory-fallback",
          lastUpdated: new Date().toLocaleTimeString(),
          totalCount: fallbackPrices.length,
          prices: fallbackPrices,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "ERP 价格接口请求失败";
        return res.status(502).json({ success: false, error: message });
      }
    }

    const currentPrices = prices.get();
    return res.json({ success: true, lastUpdated: new Date().toLocaleTimeString(), totalCount: currentPrices.length, prices: currentPrices });
  });

  app.post("/api/prices/update-price", async (req, res) => {
    if (erpConnected) {
      try {
        const { productId, name, estSellPrice, basePrice, priceSource, remarks } = req.body;
        const targetProductId = productId || (name ? await erp.findProductIdByName(String(name)) : "");
        const nextPrice = Number(estSellPrice ?? basePrice);
        if (!targetProductId || !Number.isFinite(nextPrice)) {
          return res.status(400).json({
            success: false,
            error: "同步预计出货价需要 productId 和 estSellPrice；若只传 name，必须能在 ERP 库存中唯一匹配到商品。",
          });
        }
        const payload = await erp.request("/prices/sync-est-sell", {
          method: "POST",
          body: { productId: targetProductId, estSellPrice: nextPrice, priceSource: priceSource || "网站API", remarks },
        });
        return res.json({ success: true, source: "erp-open-api", updatedPrice: payload });
      } catch (error) {
        const message = error instanceof Error ? error.message : "ERP 预计出货价同步失败";
        return res.status(502).json({ success: false, error: message });
      }
    }

    const { name, basePrice, trend } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "请提供英伟达显卡型号名称 (name)" });
    const item = prices.get().find((price) => price.name.toLowerCase() === name.toLowerCase());
    if (!item) return res.status(404).json({ success: false, error: `未找到名称为 [${name}] 的对应显卡型号` });

    if (basePrice !== undefined) item.basePrice = String(basePrice);
    if (trend !== undefined) {
      if (trend === "up" || trend === "down" || trend === "stable") item.trend = trend;
      else return res.status(400).json({ success: false, error: "trend 参数必须是 'up' | 'down' | 'stable' 之一" });
    }
    return res.json({ success: true, message: `显卡 [${item.name}] 的行情价格已成功通过 ERP 系统同步更新！`, updatedPrice: item });
  });
}
