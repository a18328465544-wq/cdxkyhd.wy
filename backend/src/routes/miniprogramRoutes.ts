import type { Express } from "express";
import { CONTACT_INFO } from "@cdxkyhd/shared";
import type { createErpCatalogService } from "../services/erpCatalogService.js";

type MiniProgramDependencies = {
  erpConnected: boolean;
  erp: Pick<ReturnType<typeof createErpCatalogService>, "fetchErpMarketQuotes" | "fetchErpStockedInventoryItems">;
};

const categories = [
  { key: "GPU", label: "显卡" },
  { key: "CPU", label: "CPU" },
  { key: "Motherboard", label: "主板" },
  { key: "RAM", label: "内存" },
  { key: "SSD", label: "硬盘" },
  { key: "PSU", label: "电源" },
  { key: "Cooler", label: "散热" },
  { key: "Case", label: "机箱" },
  { key: "WholeMachine", label: "整机" },
  { key: "Monitor", label: "显示器" },
  { key: "Accessories", label: "其他配件" },
];

function positivePrice(value: unknown) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function registerMiniprogramRoutes(app: Express, dependencies: MiniProgramDependencies) {
  app.get("/api/miniprogram/contact", (_req, res) => {
    res.json({ success: true, data: { ...CONTACT_INFO, inquirySubmissionAvailable: false } });
  });

  // This customer API must never fall back to the website's demo catalog.
  app.use("/api/miniprogram", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!dependencies.erpConnected) {
      res.status(503).json({ success: false, error: "门店数据暂未连接，请联系门店确认。" });
      return;
    }
    next();
  });

  app.get("/api/miniprogram/market-prices", async (req, res) => {
    try {
      const keyword = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
      const rows = await dependencies.erp.fetchErpMarketQuotes({ search: keyword });
      const data = rows.map((row, index) => {
        const recyclePrice = positivePrice(row.refBuyPrice ?? row.todayBuyPrice ?? row.yestBuyPrice);
        return {
          id: row.id || `${row.productId || row.model || row.productName || "quote"}:${index}`,
          model: row.model || row.productName || "未命名显卡",
          variant: row.brand || "",
          date: row.updateTime || null,
          recyclePriceLow: recyclePrice,
          recyclePriceHigh: recyclePrice,
          trend: row.trend || "stable",
        };
      }).filter((row) => row.recyclePriceLow !== null);
      res.json({ success: true, source: "erp-open-api:market-quotes", data });
    } catch (error) {
      console.error("Mini-program market prices failed:", error);
      res.status(502).json({ success: false, error: "行情暂时无法加载，请稍后再试。" });
    }
  });

  app.get("/api/miniprogram/products", async (req, res) => {
    const id = typeof req.query.id === "string" ? req.query.id.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category : "GPU";
    const selectedCategory = categories.find((item) => item.key === category);
    if (!id && !selectedCategory) {
      res.status(400).json({ success: false, error: "请选择有效的商品分类。" });
      return;
    }
    try {
      const keyword = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
      const rows = await dependencies.erp.fetchErpStockedInventoryItems({
        ...(id ? {} : { category }), search: keyword,
      });
      const data = rows.filter((row) => row.id && (!id || row.id === id)
        && ["已入库", "已上架"].includes(row.status || ""))
        .flatMap((row) => {
          const physicalCategory = categories.find((item) => item.label === row.category || item.key === row.category);
          if (!physicalCategory || (!id && physicalCategory.key !== category)) return [];
          const price = positivePrice(row.estSellPrice) ?? positivePrice(row.marketPrice);
          return [{
            id: row.id,
            name: row.productName || row.model || "未命名商品",
            category: physicalCategory.label,
            categoryKey: physicalCategory.key,
            brand: row.brand || "",
            model: row.model || "",
            conditionLevel: row.condition || "未标注",
            status: row.status,
            fullBox: typeof row.fullBox === "boolean" ? row.fullBox : null,
            inWarranty: typeof row.inWarranty === "boolean" ? row.inWarranty : null,
            repaired: typeof row.repaired === "boolean" ? row.repaired : null,
            gpuRisk: typeof row.gpuRisk === "boolean" ? row.gpuRisk : null,
            availableQuantity: 1,
            priceLow: price,
            priceHigh: price,
          }];
        });
      res.json({ success: true, source: "erp-open-api", categories, data });
    } catch (error) {
      console.error("Mini-program products failed:", error);
      res.status(502).json({ success: false, error: "商品暂时无法加载，请稍后再试。" });
    }
  });
}
