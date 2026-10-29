import type { Express } from "express";
import { GPU_DAILY_MODELS, GPU_PRICE_HISTORY_PERIODS, type GpuPriceHistoryPeriod } from "@cdxkyhd/shared";
import type { GpuPriceHistoryService } from "../services/gpuPriceHistoryService.js";

export function registerGpuPriceHistoryRoutes(app: Express, service: GpuPriceHistoryService) {
  app.get("/api/gpu-daily/history", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const model = req.query.model;
    const days = req.query.days ?? "30";
    if (typeof model !== "string" || !GPU_DAILY_MODELS.some(([id]) => id === model)
      || typeof days !== "string" || !GPU_PRICE_HISTORY_PERIODS.some(period => String(period) === days)) {
      return res.status(400).json({ success: false, error: "请选择有效的显卡型号及 7、30 或 90 天范围" });
    }
    try {
      await service.refresh();
      return res.json(service.history(model, Number(days) as GpuPriceHistoryPeriod));
    } catch {
      return res.status(503).json({ success: false, error: "报价历史归档暂不可用，请稍后重试" });
    }
  });
}
