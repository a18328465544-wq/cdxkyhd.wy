import type { Express } from "express";

export function registerHealthRoutes(app: Express, erpMode: "connected" | "mock-fallback") {
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "cdxkyhd-api-gateway",
      timestamp: new Date().toISOString(),
      shop: "成都显卡一号店 (Chengdu GPU No.1 Studio)",
      erpMode,
    });
  });
}
