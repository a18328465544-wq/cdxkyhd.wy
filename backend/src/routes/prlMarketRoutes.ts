import type { Express } from "express";
import { PrlMarketService } from "../services/prlMarketService.js";

export function registerPrlMarketRoutes(app: Express) {
  const market = new PrlMarketService(process.env.COINGECKO_DEMO_API_KEY?.trim());
  app.get("/api/market/prl", async (_req, res) => {
    const result = await market.getPrice();
    res.set("Cache-Control", "no-store").status(result.status === "unavailable" ? 503 : 200).json(result);
  });
}
