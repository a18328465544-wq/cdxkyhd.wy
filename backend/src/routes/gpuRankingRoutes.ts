import type { Express } from "express";

type RankingSnapshot = { checkedAt: string } | null;

interface RankingService {
  getSnapshot(): RankingSnapshot;
  refresh(): unknown;
}

interface RankingStatusService extends RankingService {
  getStatus(): unknown;
}

export interface GpuRankingRouteServices {
  gpu: RankingService;
  blender: RankingService;
  geekbench: RankingStatusService;
  threeDMark: RankingStatusService;
  refreshIntervals: {
    gpu: number;
    blender: number;
    geekbench: number;
    threeDMark: number;
  };
}

export function registerGpuRankingRoutes(app: Express, services: GpuRankingRouteServices) {
  app.get("/api/gpu-ranking", (_req, res) => {
    const snapshot = services.gpu.getSnapshot();
    const blenderSnapshot = services.blender.getSnapshot();
    const geekbenchSnapshot = services.geekbench.getSnapshot();
    const threeDMarkSnapshot = services.threeDMark.getSnapshot();
    if (!snapshot || Date.now() - Date.parse(snapshot.checkedAt) >= services.refreshIntervals.gpu) {
      void services.gpu.refresh();
    }
    if (!blenderSnapshot || Date.now() - Date.parse(blenderSnapshot.checkedAt) >= services.refreshIntervals.blender) {
      void services.blender.refresh();
    }
    if (!geekbenchSnapshot || Date.now() - Date.parse(geekbenchSnapshot.checkedAt) >= services.refreshIntervals.geekbench) {
      void services.geekbench.refresh();
    }
    if (!threeDMarkSnapshot || Date.now() - Date.parse(threeDMarkSnapshot.checkedAt) >= services.refreshIntervals.threeDMark) {
      void services.threeDMark.refresh();
    }
    if (!snapshot && !blenderSnapshot && !geekbenchSnapshot && !threeDMarkSnapshot) {
      return res.status(503).json({
        success: false,
        syncing: true,
        source: "https://www.tomshardware.com/reviews/gpu-hierarchy,4388.html",
        error: "显卡成绩正在从测试数据源同步，请稍后重试。",
      });
    }
    return res.json({
      success: true,
      snapshot,
      blenderSnapshot,
      geekbenchSnapshot,
      geekbenchStatus: services.geekbench.getStatus(),
      threeDMarkSnapshot,
      threeDMarkStatus: services.threeDMark.getStatus(),
    });
  });
}
