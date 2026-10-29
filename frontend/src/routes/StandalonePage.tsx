import { lazy } from "react";
import type { StandalonePageRoute } from "./pageRoutes";

const GpuSnLookupSection = lazy(() => import("../components/GpuSnLookupSection"));
const CommunityPage = lazy(() => import("../components/CommunityPage"));
const PcBuilderSection = lazy(() => import("../components/PcBuilderSection"));
const AiWorkstationSection = lazy(() => import("../components/AiWorkstationSection"));
const HardwareToolsRouter = lazy(() => import("../components/tools/HardwareToolsRouter"));
const GpuRankingPage = lazy(() => import("../components/GpuRankingPage"));
const GpuDailyPage = lazy(() => import("../components/GpuDailyPage"));

interface StandalonePageProps {
  route: StandalonePageRoute;
  onOpenContact: () => void;
}

export default function StandalonePage({ route, onOpenContact }: StandalonePageProps) {
  const content = (() => {
    switch (route.id) {
      case "gpu-daily":
        return <GpuDailyPage />;
      case "gpu-sn":
        return <GpuSnLookupSection />;
      case "community":
        return <CommunityPage />;
      case "hardware-tools":
        return <HardwareToolsRouter />;
      case "gpu-ranking":
        return <GpuRankingPage onOpenContact={onOpenContact} />;
      case "build":
        return (
          <main className="flex-1 pt-16 sm:pt-20">
            <div id="pc-builder"><PcBuilderSection /></div>
            <div id="workstation"><AiWorkstationSection onOpenContact={onOpenContact} /></div>
          </main>
        );
    }
  })();

  return route.id === "gpu-sn" ? <main className="flex-1">{content}</main> : content;
}
