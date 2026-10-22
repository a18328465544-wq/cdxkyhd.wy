import { lazy } from "react";
import { ReusedToolPage } from "./ReusedToolPage";

const ToolCenterPage = lazy(() => import("./ToolCenterPage"));
const HashrateRentalCalculatorPage = lazy(() => import("./HashrateRentalCalculatorPage"));
const PrlMiningCalculatorPage = lazy(() => import("./PrlMiningCalculatorPage"));

const ROUTES = {
  "/tools/keyboard": {
    title: "键盘按键测试",
    src: "/hardware-tools/keyboard.html",
  },
  "/tools/mouse": {
    title: "鼠标全面测试",
    src: "/hardware-tools/mouse.html",
  },
  "/tools/audio": {
    title: "音响与耳机测试",
    src: "/hardware-tools/audio.html",
  },
  "/tools/monitor": {
    title: "显示器测试",
    src: "/hardware-tools/monitor.html",
  },
} as const;

export default function HardwareToolsRouter() {
  const path = window.location.pathname.replace(/\/$/, "") || "/tools";
  if (path === "/tools/hashrate-rental") return <HashrateRentalCalculatorPage />;
  if (path === "/tools/prl-mining") return <PrlMiningCalculatorPage />;
  const route = ROUTES[path as keyof typeof ROUTES];

  if (!route) {
    const Page = ToolCenterPage;
    return <Page />;
  }

  return <ReusedToolPage {...route} />;
}
