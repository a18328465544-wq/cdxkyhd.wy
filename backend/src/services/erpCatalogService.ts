import { mapErpInventoryPresentation } from "../inventoryPresentation.js";
import type { GpuPrice, InventoryItem } from "../types/catalog.js";
import type { ErpInventoryCard, ErpInventorySummaryRow, ErpMarketQuote, ErpQueryValue } from "../types/erpCatalog.js";

interface ErpCatalogConfig {
  baseUrl?: string;
  apiKey?: string;
}

export function createErpCatalogService(config: ErpCatalogConfig) {
  const ERP_BASE_URL = config.baseUrl?.replace(/\/+$/, "");
  const ERP_API_KEY = config.apiKey;
  const pendingReads = new Map<string, Promise<unknown>>();

  type PaginatedErpResponse<T> = {
    data?: T[] | { data?: T[]; meta?: { total?: number; page?: number; pageSize?: number } };
    meta?: { total?: number; page?: number; pageSize?: number };
    error?: { message?: string };
  };

  function getErpOpenBaseUrl() {
    if (!ERP_BASE_URL) return "";
    return ERP_BASE_URL.endsWith("/api/open") ? ERP_BASE_URL : `${ERP_BASE_URL}/api/open`;
  }

  function getErpHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (ERP_API_KEY) {
      headers.Authorization = `Bearer ${ERP_API_KEY}`;
    }
    return headers;
  }

  async function requestErpOpen<T>(pathname: string, options: { method?: string; query?: URLSearchParams; body?: unknown } = {}) {
    const baseUrl = getErpOpenBaseUrl();
    if (!baseUrl) {
      throw new Error("ERP_BASE_URL 未配置");
    }

    const query = options.query?.toString();
    const url = `${baseUrl}${pathname}${query ? `?${query}` : ""}`;
    const readOnly = !options.method || options.method === "GET";
    if (readOnly && pendingReads.has(url)) return pendingReads.get(url) as Promise<T>;
    if (!readOnly) pendingReads.clear();
    const operation = (async () => {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers: getErpHeaders(),
        body: options.method && options.method !== "GET" ? JSON.stringify(options.body ?? {}) : undefined,
        signal: AbortSignal.timeout(8000),
      });

      const text = await response.text();
      const payload = text ? JSON.parse(text) as T : ({} as T);
      if (!response.ok) {
        const message = (payload as { error?: { message?: string } })?.error?.message || `ERP Open API 请求失败：${response.status}`;
        throw new Error(message);
      }
      return payload;
    })();
    if (readOnly && pendingReads.size < 128) pendingReads.set(url, operation);
    try { return await operation; }
    finally {
      if (!readOnly) pendingReads.clear();
      else if (pendingReads.get(url) === operation) pendingReads.delete(url);
    }
  }

  function extractRows<T>(payload: PaginatedErpResponse<T>) {
    if (Array.isArray(payload.data)) return { rows: payload.data, meta: payload.meta };
    if (payload.data && typeof payload.data === "object" && Array.isArray(payload.data.data)) {
      return { rows: payload.data.data, meta: payload.data.meta };
    }
    return { rows: [], meta: payload.meta };
  }

  function toErpCategory(category: string) {
    const categoryMap: Record<string, string> = {
      GPU: "显卡",
      CPU: "CPU",
      Motherboard: "主板",
      RAM: "内存",
      SSD: "硬盘",
      PSU: "电源",
      Case: "机箱",
      Cooler: "散热",
      WholeMachine: "整机",
      Monitor: "显示器",
      Assembly: "组装拆卸",
      Accessories: "其他配件",
    };
    return categoryMap[category] || category;
  }

  function toWebsiteCategory(category?: string): InventoryItem["category"] {
    const categoryMap: Record<string, InventoryItem["category"]> = {
      显卡: "GPU",
      CPU: "CPU",
      主板: "Motherboard",
      内存: "RAM",
      硬盘: "SSD",
      电源: "PSU",
      机箱: "Case",
      散热: "Cooler",
      整机: "WholeMachine",
      显示器: "Monitor",
      组装拆卸: "Assembly",
      其他配件: "Accessories",
    };
    return categoryMap[category || ""] || "Accessories";
  }

  function stockStatus(quantity: number): "有货" | "库存紧张" | "缺货" {
    if (quantity <= 0) return "缺货";
    if (quantity <= 3) return "库存紧张";
    return "有货";
  }

  function inferWattage(name: string, category: InventoryItem["category"]) {
    if (category === "PSU") {
      const watt = name.match(/(\d{3,4})\s*W/i)?.[1];
      return watt ? Number(watt) : undefined;
    }
    if (category === "GPU") {
      if (/5090/.test(name)) return 600;
      if (/4090/.test(name)) return 450;
      if (/4080/.test(name)) return 320;
      if (/3090/.test(name)) return 350;
      return 250;
    }
    if (category === "CPU") {
      if (/i9|7950|9950/i.test(name)) return 250;
      return 125;
    }
    return undefined;
  }

  function mapSummaryToInventoryItem(row: ErpInventorySummaryRow): InventoryItem {
    const name = row.productName || row.model || row.key || "未命名商品";
    const category = toWebsiteCategory(row.category);
    const quantity = Number(row.availableCount ?? row.totalCount ?? 0);
    const price = Number(row.avgEstSell || (row.totalEstSell && row.totalCount ? row.totalEstSell / row.totalCount : 0) || row.refSellPrice || 0);
    return {
      id: row.productId || row.key || name,
      name,
      category,
      price: Math.round(price),
      quantity,
      condition: "全新",
      specs: [row.brand, row.version, row.model, row.vram, row.warehouseLocation].filter(Boolean).join(" | ") || "库存同步商品",
      status: stockStatus(quantity),
      wattage: inferWattage(name, category),
    };
  }

  function mapCardToInventoryItem(card: ErpInventoryCard): InventoryItem {
    const name = card.productName || card.model || card.id || "未命名商品";
    const category = toWebsiteCategory(card.category);
    const quantity = ["已入库", "已上架"].includes(card.status || "") ? 1 : 0;
    return {
      id: card.id || card.productId || name,
      name,
      category,
      price: Math.round(Number(card.estSellPrice || card.marketPrice || 0)),
      quantity,
      specs: [card.brand, card.version, card.model, card.vram, card.sn, card.warehouseLocation].filter(Boolean).join(" | "),
      publicSpecs: [card.brand, card.version, card.model, card.vram].filter(Boolean).join(" | "),
      wattage: inferWattage(name, category),
      ...mapErpInventoryPresentation(card),
    };
  }

  function mapInventoryToGpuPrice(item: InventoryItem, index: number): GpuPrice {
    const aiModel = /A[0-9]{4}|RTX PRO|PRO 6000|A6000|A5000|A4000/i.test(item.name);
    const gamingModel = /RTX|GTX|RX|Arc/i.test(item.name);
    return {
      name: item.name,
      category: aiModel && gamingModel ? "both" : aiModel ? "ai" : "gaming",
      basePrice: String(Math.max(0, item.price || 0)),
      trend: "stable",
      popular: index < 4,
      specs: {
        vram: item.specs.match(/(\d+\s*(GB|G|TB))/i)?.[1]?.replace(/\s+/g, "") || "按库存档案",
        tdp: item.wattage ? `${item.wattage}W` : "按实测功耗",
      },
    };
  }

  function formatPriceForWebsite(price: number) {
    const normalized = Math.max(0, Math.round(Number(price || 0)));
    return normalized > 0 ? String(normalized) : "微信详询";
  }

  function inferGpuVram(name: string) {
    return name.match(/(\d{1,3}\s*(GB|G))/i)?.[1]?.replace(/\s+/g, "") || "按行情档案";
  }

  function mapMarketQuoteToGpuPrice(quote: ErpMarketQuote, index: number): GpuPrice {
    const name = quote.model || quote.productName || "未命名显卡";
    const aiModel = /A[0-9]{4}|RTX PRO|PRO 6000|A6000|A5000|A4000/i.test(name);
    const gamingModel = /RTX|GTX|RX|Arc/i.test(name);
    const buyPrice = Number(quote.refBuyPrice ?? quote.todayBuyPrice ?? quote.yestBuyPrice ?? 0);
    const trend = quote.trend || ((quote.changeAmount || 0) > 0 ? "up" : (quote.changeAmount || 0) < 0 ? "down" : "stable");
    const wattage = inferWattage(name, "GPU");
    return {
      name,
      category: aiModel && gamingModel ? "both" : aiModel ? "ai" : "gaming",
      basePrice: formatPriceForWebsite(buyPrice),
      trend,
      popular: index < 4,
      specs: {
        vram: inferGpuVram(name),
        tdp: wattage ? `${wattage}W` : "按实测功耗",
      },
    };
  }

  async function fetchErpMarketQuotes(querySource: Record<string, ErpQueryValue>) {
    const rows: ErpMarketQuote[] = [];
    const baseQuery = new URLSearchParams();
    const keyword = String(querySource.search || querySource.keyword || "");
    const brand = String(querySource.brand || "");
    if (keyword) baseQuery.set("q", keyword);
    if (brand && brand !== "all") baseQuery.set("brand", brand);
    baseQuery.set("pageSize", "200");

    for (let page = 1; page <= 20; page += 1) {
      const query = new URLSearchParams(baseQuery);
      query.set("page", String(page));
      const payload = await requestErpOpen<PaginatedErpResponse<ErpMarketQuote>>("/prices/market-quotes", { query });
      const { rows: pageRows, meta } = extractRows(payload);
      rows.push(...pageRows);
      if (!meta?.total || rows.length >= meta.total || pageRows.length === 0) break;
    }

    return rows;
  }

  async function fetchErpInventorySummary(querySource: Record<string, ErpQueryValue>) {
    const rows: ErpInventorySummaryRow[] = [];
    const baseQuery = new URLSearchParams();
    const category = String(querySource.category || "");
    const keyword = String(querySource.search || querySource.keyword || "");
    if (category && category !== "All") baseQuery.set("category", toErpCategory(category));
    if (keyword) baseQuery.set("keyword", keyword);
    baseQuery.set("pageSize", "200");

    for (let page = 1; page <= 20; page += 1) {
      const query = new URLSearchParams(baseQuery);
      query.set("page", String(page));
      const payload = await requestErpOpen<PaginatedErpResponse<ErpInventorySummaryRow>>("/inventory/summary", { query });
      const { rows: pageRows, meta } = extractRows(payload);
      rows.push(...pageRows);
      if (!meta?.total || rows.length >= meta.total || pageRows.length === 0) break;
    }

    const inStockOnly = querySource.inStock === "true";
    return inStockOnly ? rows.filter((item) => Number(item.availableCount ?? item.totalCount ?? 0) > 0) : rows;
  }

  async function fetchErpStockedInventoryItems(querySource: Record<string, ErpQueryValue>) {
    const rows: ErpInventoryCard[] = [];
    const category = String(querySource.category || "");
    const keyword = String(querySource.search || querySource.keyword || "");
    const stockedStatuses = ["已入库", "已上架"];

    for (const status of stockedStatuses) {
      const baseQuery = new URLSearchParams();
      baseQuery.set("status", status);
      baseQuery.set("pageSize", "200");
      if (category && category !== "All") baseQuery.set("category", toErpCategory(category));
      if (keyword) baseQuery.set("keyword", keyword);

      for (let page = 1; page <= 20; page += 1) {
        const query = new URLSearchParams(baseQuery);
        query.set("page", String(page));
        const payload = await requestErpOpen<PaginatedErpResponse<ErpInventoryCard>>("/inventory/items", { query });
        const { rows: pageRows, meta } = extractRows(payload);
        rows.push(...pageRows);
        if (!meta?.total || pageRows.length === 0 || page * Number(meta.pageSize || 200) >= meta.total) break;
      }
    }

    return rows.sort((a, b) => String(b.id || "").localeCompare(String(a.id || "")));
  }

  async function findErpProductIdByName(name: string) {
    const query = new URLSearchParams({ keyword: name, pageSize: "1", page: "1" });
    const payload = await requestErpOpen<PaginatedErpResponse<ErpInventoryCard>>("/inventory/items", { query });
    const { rows } = extractRows(payload);
    return rows[0]?.productId;
  }
  return {
    toWebsiteCategory,
    requestErpOpen,
    mapSummaryToInventoryItem,
    mapCardToInventoryItem,
    mapInventoryToGpuPrice,
    mapMarketQuoteToGpuPrice,
    fetchErpMarketQuotes,
    fetchErpInventorySummary,
    fetchErpStockedInventoryItems,
    findErpProductIdByName,
  };
}
