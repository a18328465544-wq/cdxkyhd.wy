import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import {randomBytes} from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BlenderGpuRankingService, BLENDER_RANKING_REFRESH_INTERVAL_MS } from "./blenderRankingService.js";
import { GpuRankingService, GPU_RANKING_REFRESH_INTERVAL_MS } from "./gpuRankingService.js";
import { GeekbenchGpuRankingService, GEEKBENCH_GPU_RANKING_REFRESH_INTERVAL_MS } from "./geekbenchGpuRankingService.js";
import { ThreeDMarkRankingService, THREE_DMARK_RANKING_REFRESH_INTERVAL_MS } from "./threeDMarkRankingService.js";
import { PublicThreeDMarkRankingService, PUBLIC_3DMARK_REFRESH_INTERVAL_MS } from "./publicThreeDMarkRankingService.js";
import {createForumRouter, type ForumProductOption} from "./forumRoutes.js";
import {ForumStore} from "./forumStore.js";
import { createErpCatalogService } from "./services/erpCatalogService.js";
import { registerMiniprogramRoutes } from "./routes/miniprogramRoutes.js";
import { mockCatalogStore } from "./services/mockCatalogStore.js";
import { registerPrlMarketRoutes } from "./routes/prlMarketRoutes.js";
import { registerGpuDailyRoutes } from "./routes/gpuDailyRoutes.js";
import { registerGpuPriceHistoryRoutes } from "./routes/gpuPriceHistoryRoutes.js";
import { GpuPriceHistoryService } from "./services/gpuPriceHistoryService.js";
import { registerHealthRoutes } from "./routes/healthRoutes.js";
import { registerGpuRankingRoutes } from "./routes/gpuRankingRoutes.js";
import { registerGpuSnRoutes } from "./routes/gpuSnRoutes.js";
import { registerCatalogRoutes } from "./routes/catalogRoutes.js";
import { registerPcBuilderRoutes } from "./routes/pcBuilderRoutes.js";
import { registerHttpPerformance, registerStaticFiles } from "./httpPerformance.js";
import { registerPerformanceRoutes } from "./routes/performanceRoutes.js";
import { renderGpuRankingSeoHtml, renderSearchablePageSeoHtml, SEARCHABLE_SEO_PAGE_PATHS } from "./seoPage.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

[
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env"),
  path.resolve(currentDir, "../../.env"),
].forEach((envPath) => {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
});

const { getInventory, replaceInventory, getPrices } = mockCatalogStore;
const ERP_BASE_URL = process.env.ERP_BASE_URL?.replace(/\/+$/, "");

const erpCatalog = createErpCatalogService({
  baseUrl: ERP_BASE_URL,
  apiKey: process.env.ERP_API_KEY,
});
const {
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
} = erpCatalog;

async function startServer() {
  const app = express();
  registerHttpPerformance(app);
  const PORT = Number(process.env.PORT ?? 3001);
  const gpuRankingCacheFile = process.env.GPU_RANKING_CACHE_FILE
    ? path.resolve(process.env.GPU_RANKING_CACHE_FILE)
    : path.resolve(currentDir, "../../data/gpu-ranking-cache.json");
  const gpuRankingService = await GpuRankingService.open({ cacheFile: gpuRankingCacheFile });
  const blenderRankingCacheFile = process.env.BLENDER_RANKING_CACHE_FILE
    ? path.resolve(process.env.BLENDER_RANKING_CACHE_FILE)
    : path.resolve(currentDir, "../../data/blender-ranking-cache.json");
  const blenderRankingService = await BlenderGpuRankingService.open({ cacheFile: blenderRankingCacheFile });
  const geekbenchRankingCacheFile = process.env.GEEKBENCH_RANKING_CACHE_FILE
    ? path.resolve(process.env.GEEKBENCH_RANKING_CACHE_FILE)
    : path.resolve(currentDir, "../../data/geekbench-ranking-cache.json");
  const geekbenchRankingService = await GeekbenchGpuRankingService.open({
    cacheFile: geekbenchRankingCacheFile,
    apiKey: process.env.GEEKBENCH_BROWSER_API_KEY,
    redistributionAllowed: process.env.GEEKBENCH_REDISPLAY_ALLOWED === "true",
  });
  const threeDMarkRankingCacheFile = process.env.THREE_DMARK_RANKING_CACHE_FILE
    ? path.resolve(process.env.THREE_DMARK_RANKING_CACHE_FILE)
    : path.resolve(currentDir, "../../data/3dmark-ranking-cache.json");
  const threeDMarkDataFile = process.env.THREE_DMARK_RANKING_DATA_FILE
    ? path.resolve(process.env.THREE_DMARK_RANKING_DATA_FILE)
    : undefined;
  const useThreeDMarkFile = Boolean(threeDMarkDataFile) || process.env.THREE_DMARK_RANKING_SOURCE === "file";
  const threeDMarkRefreshInterval = useThreeDMarkFile ? THREE_DMARK_RANKING_REFRESH_INTERVAL_MS : PUBLIC_3DMARK_REFRESH_INTERVAL_MS;
  const threeDMarkRankingService = useThreeDMarkFile ? await ThreeDMarkRankingService.open({
    cacheFile: threeDMarkRankingCacheFile,
    dataFile: threeDMarkDataFile,
    redistributionAllowed: process.env.THREE_DMARK_REDISPLAY_ALLOWED === "true",
  }) : await PublicThreeDMarkRankingService.open({
    cacheFile: threeDMarkRankingCacheFile,
    seedFile: path.resolve(currentDir, "../data/3dmark-public-reference.json"),
  });
  void gpuRankingService.refresh();
  void blenderRankingService.refresh();
  void geekbenchRankingService.refresh();
  void threeDMarkRankingService.refresh();
  const gpuRankingRefreshTimer = setInterval(() => void gpuRankingService.refresh(), GPU_RANKING_REFRESH_INTERVAL_MS);
  const blenderRankingRefreshTimer = setInterval(() => void blenderRankingService.refresh(), BLENDER_RANKING_REFRESH_INTERVAL_MS);
  const geekbenchRankingRefreshTimer = setInterval(() => void geekbenchRankingService.refresh(), GEEKBENCH_GPU_RANKING_REFRESH_INTERVAL_MS);
  const threeDMarkRankingRefreshTimer = setInterval(() => void threeDMarkRankingService.refresh(), threeDMarkRefreshInterval);
  gpuRankingRefreshTimer.unref();
  blenderRankingRefreshTimer.unref();
  geekbenchRankingRefreshTimer.unref();
  threeDMarkRankingRefreshTimer.unref();
  const forumDataDirectory = process.env.FORUM_DATA_DIR
    ? path.resolve(process.env.FORUM_DATA_DIR)
    : path.resolve(currentDir, "../../data/forum");
  const forumStore = await ForumStore.open(forumDataDirectory);
  const forumSessionSecret = process.env.FORUM_SESSION_SECRET || (process.env.NODE_ENV === "production" ? "" : randomBytes(32).toString("base64url"));

  // Body parsing and CORS
  app.use(express.json({limit: "128kb"}));
  if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
      credentials: true,
    })
  );

  // ----------------------------------------------------
  // API Routes
  // ----------------------------------------------------

  registerHealthRoutes(app, ERP_BASE_URL ? "connected" : "mock-fallback");
  registerPerformanceRoutes(app, process.env.PERFORMANCE_DATA_DIR || path.resolve(currentDir, "../../data/performance"), process.env.PERFORMANCE_SITE_ORIGIN);
  registerMiniprogramRoutes(app, { erpConnected: Boolean(ERP_BASE_URL), erp: erpCatalog });
  registerPrlMarketRoutes(app);
  const dailyPriceFile = process.env.GPU_DAILY_PRICE_FILE
    ? path.resolve(process.env.GPU_DAILY_PRICE_FILE)
    : path.resolve(currentDir, "../../data/gpu-daily/prices.json");
  registerGpuDailyRoutes(app, dailyPriceFile);
  const priceHistory = await GpuPriceHistoryService.open({ feedFile: dailyPriceFile,
    archiveFile: process.env.GPU_DAILY_HISTORY_FILE ? path.resolve(process.env.GPU_DAILY_HISTORY_FILE) : path.join(path.dirname(dailyPriceFile), "history.json") });
  registerGpuPriceHistoryRoutes(app, priceHistory);
  void priceHistory.refresh();
  const priceHistoryTimer = setInterval(() => void priceHistory.refresh(), 60_000);
  priceHistoryTimer.unref();

  registerGpuRankingRoutes(app, {
    gpu: gpuRankingService,
    blender: blenderRankingService,
    geekbench: geekbenchRankingService,
    threeDMark: threeDMarkRankingService,
    refreshIntervals: {
      gpu: GPU_RANKING_REFRESH_INTERVAL_MS,
      blender: BLENDER_RANKING_REFRESH_INTERVAL_MS,
      geekbench: GEEKBENCH_GPU_RANKING_REFRESH_INTERVAL_MS,
      threeDMark: threeDMarkRefreshInterval,
    },
  });

  app.use("/api/forum", createForumRouter({
    store: forumStore,
    dataDirectory: forumDataDirectory,
    sessionSecret: forumSessionSecret,
    adminPassword: process.env.FORUM_ADMIN_PASSWORD || "",
    isProduction: process.env.NODE_ENV === "production",
    findProducts: async (query): Promise<ForumProductOption[]> => {
      const normalized = query.trim().toLocaleLowerCase();
      if (normalized.length < 2) return [];
      if (ERP_BASE_URL) {
        const rows = await fetchErpStockedInventoryItems({search: query});
        const products = new Map<string, ForumProductOption>();
        for (const row of rows) {
          const productId = String(row.productId || row.id || "");
          const name = row.productName || row.model || row.id || "未命名商品";
          if (!productId || (!name.toLocaleLowerCase().includes(normalized) && !productId.toLocaleLowerCase().includes(normalized))) continue;
          products.set(productId, {
            id: productId,
            name,
            category: toWebsiteCategory(row.category),
            condition: row.condition,
            stockStatus: ["已入库", "已上架"].includes(row.status || "") ? "有货" : "状态以 ERP 为准",
          });
          if (products.size >= 12) break;
        }
        return [...products.values()];
      }
      return getInventory()
        .filter((item) => item.name.toLocaleLowerCase().includes(normalized))
        .slice(0, 12)
        .map((item) => ({id: item.id, name: item.name, category: item.category, condition: item.condition, stockStatus: item.status}));
    },
  }));

  registerGpuSnRoutes(app);

  registerCatalogRoutes(app, {
    erpConnected: Boolean(ERP_BASE_URL),
    inventory: {
      get: getInventory,
      replace: replaceInventory,
    },
    prices: { get: getPrices },
    erp: {
      fetchStockedInventoryItems: fetchErpStockedInventoryItems,
      fetchMarketQuotes: fetchErpMarketQuotes,
      fetchInventorySummary: fetchErpInventorySummary,
      findProductIdByName: findErpProductIdByName,
      mapCardToInventoryItem,
      mapMarketQuoteToGpuPrice,
      mapSummaryToInventoryItem,
      mapInventoryToGpuPrice,
      request: requestErpOpen,
    },
  });

  registerPcBuilderRoutes(app, {
    erpConnected: Boolean(ERP_BASE_URL),
    getInventory,
    fetchErpParts: async (query) => (await fetchErpStockedInventoryItems(query)).map(mapCardToInventoryItem),
    replaceInventory,
  });

  const frontendDist = [
    path.resolve(process.cwd(), "frontend/dist"),
    path.resolve(process.cwd(), "../frontend/dist"),
    path.resolve(currentDir, "../../frontend/dist"),
  ].find((candidate) => existsSync(path.join(candidate, "index.html")));

  if (frontendDist) {
    app.get("/gpu-ranking", async (_req, res, next) => {
      try {
        const appShell = await readFile(path.join(frontendDist, "index.html"), "utf8");
        res
          .status(200)
          .set("Cache-Control", "no-cache")
          .type("html")
          .send(renderGpuRankingSeoHtml(appShell, gpuRankingService.getSnapshot()));
      } catch (error) {
        next(error);
      }
    });
    app.get([...SEARCHABLE_SEO_PAGE_PATHS], async (req, res, next) => {
      try {
        const appShell = await readFile(path.join(frontendDist, "index.html"), "utf8");
        res
          .status(200)
          .set("Cache-Control", "no-cache")
          .type("html")
          .send(renderSearchablePageSeoHtml(appShell, req.path));
      } catch (error) {
        next(error);
      }
    });
    registerStaticFiles(app, frontendDist, process.env.STATIC_ASSET_FALLBACK_DIR);
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) {
        next();
        return;
      }
      res.set("Cache-Control", "no-cache").sendFile(path.join(frontendDist, "index.html"));
    });
  }

  app.listen(PORT, process.env.HOST || "0.0.0.0", () => {
    console.log(`[Express API Gateway] running on http://localhost:${PORT}`);
    console.log(`[Express API Gateway] ERP mode: ${ERP_BASE_URL ? ERP_BASE_URL : "mock fallback"}`);
    console.log(`[Express API Gateway] frontend: ${frontendDist || "not found"}`);
  });
}

startServer();
