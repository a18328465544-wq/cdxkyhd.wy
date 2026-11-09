export type StandalonePageId = "gpu-sn" | "community" | "build" | "hardware-tools" | "gpu-ranking" | "gpu-daily";

export interface StandalonePageRoute {
  id: StandalonePageId;
  title: string;
  fallbackLabel: string;
  fallbackHeight: string;
  prefetchHomeSections: boolean;
}

const standalonePages: Record<StandalonePageId, StandalonePageRoute> = {
  "gpu-daily": {
    id: "gpu-daily", title: "显卡日报 · 今日全新显卡价格 - 成都显卡一号店",
    fallbackLabel: "显卡日报", fallbackHeight: "900px", prefetchHomeSections: false,
  },
  "gpu-sn": {
    id: "gpu-sn",
    title: "显卡 SN 码查询生产日期 - 成都显卡一号店",
    fallbackLabel: "显卡 SN 查询",
    fallbackHeight: "1000px",
    prefetchHomeSections: false,
  },
  community: {
    id: "community",
    title: "显卡玩家交流社区 - 成都显卡一号店",
    fallbackLabel: "社区内容",
    fallbackHeight: "100vh",
    prefetchHomeSections: false,
  },
  build: {
    id: "build",
    title: "装机配置与 AI 工作站 - 成都显卡一号店",
    fallbackLabel: "在线装机",
    fallbackHeight: "980px",
    prefetchHomeSections: false,
  },
  "hardware-tools": {
    id: "hardware-tools",
    title: "硬件工具：选购对比、查询检测与成本计算 - 成都显卡一号店",
    fallbackLabel: "硬件工具",
    fallbackHeight: "760px",
    prefetchHomeSections: false,
  },
  "gpu-ranking": {
    id: "gpu-ranking",
    title: "显卡性能天梯 - 成都显卡一号店",
    fallbackLabel: "显卡性能天梯",
    fallbackHeight: "900px",
    prefetchHomeSections: false,
  },
};

export function resolveStandalonePage(pathname: string): StandalonePageRoute | null {
  if (pathname === "/gpu-daily" || pathname === "/gpu-daily/") return standalonePages["gpu-daily"];
  if (pathname === "/gpu-sn.php" || pathname === "/gpu-sn") return standalonePages["gpu-sn"];
  if (pathname === "/community" || pathname.startsWith("/community/")) return standalonePages.community;
  if (pathname === "/build" || pathname === "/build/") return standalonePages.build;
  if (pathname === "/tools" || pathname.startsWith("/tools/")) return standalonePages["hardware-tools"];
  if (pathname === "/gpu-ranking" || pathname === "/gpu-ranking/") return standalonePages["gpu-ranking"];
  return null;
}
