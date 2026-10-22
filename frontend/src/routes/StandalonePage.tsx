import { Suspense, lazy } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingContactButton from "../components/FloatingContactButton";
import { SectionFallback } from "../components/PageLoading";
import type { StandalonePageRoute } from "./pageRoutes";
import PageQuestions from "../components/PageQuestions";

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
            <Suspense fallback={<SectionFallback label="在线装机" minHeight="980px" />}>
              <div id="pc-builder"><PcBuilderSection /></div>
            </Suspense>
            <Suspense fallback={<SectionFallback label="AI 工作站" minHeight="720px" />}>
              <div id="workstation"><AiWorkstationSection onOpenContact={onOpenContact} /></div>
            </Suspense>
          </main>
        );
    }
  })();

  const pageContent = route.id === "build" ? content : route.id === "gpu-sn" ? (
    <main className="flex-1">
      <Suspense fallback={<SectionFallback label={route.fallbackLabel} minHeight={route.fallbackHeight} />}>
        {content}
      </Suspense>
    </main>
  ) : (
    <Suspense fallback={<SectionFallback label={route.fallbackLabel} minHeight={route.fallbackHeight} />}>
      {content}
    </Suspense>
  );

  return (
    <div className={`flex min-h-screen flex-col font-sans text-slate-800 antialiased ${route.id === "build" ? "bg-white pb-[calc(3.75rem+env(safe-area-inset-bottom))] sm:pb-0 selection:bg-blue-500/25 selection:text-blue-900" : "bg-slate-50"}`}>
      <Header onOpenContact={onOpenContact} />
      {pageContent}
      <PageQuestions pathname={window.location.pathname} />
      <Footer compact={route.id !== "build"} />
      {route.id === "build" && <FloatingContactButton onOpenContact={onOpenContact} />}
    </div>
  );
}
