import type { Express } from "express";
import { readFile, stat } from "node:fs/promises";
import { emptyDailyGpuPrices, normalizeDailyGpuPrices } from "@cdxkyhd/shared";

/** The website consumes a public-only file; the collector remains a separate service. */
export function registerGpuDailyRoutes(app: Express, file: string) {
  app.get("/api/gpu-daily", async (_req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      if ((await stat(file)).size > 256 * 1024) throw new Error("oversized snapshot");
      const raw: unknown = JSON.parse(await readFile(file, "utf8"));
      res.json(normalizeDailyGpuPrices(raw));
    } catch {
      // No source path, credentials, raw records or yesterday's prices in a public error.
      res.json(emptyDailyGpuPrices());
    }
  });
}
