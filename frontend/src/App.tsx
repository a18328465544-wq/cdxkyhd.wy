import { Suspense, lazy, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ContactModalFallback, SectionFallback } from "./components/PageLoading";
import { resolveStandalonePage } from "./routes/pageRoutes";
import StandalonePage from "./routes/StandalonePage";
import { resolveSeoPage } from "@cdxkyhd/shared";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FloatingContactButton from "./components/FloatingContactButton";
import PageQuestions from "./components/PageQuestions";
import RouteViewport from "./routes/RouteViewport";
import RouteErrorBoundary from "./routes/RouteErrorBoundary";
import { useSiteNavigation } from "./routes/SiteNavigation";
import { trackConversion, type ConversionEvent } from "./lib/conversionAnalytics";

const loadContactModal = () => import("./components/ContactModal");
const ContactModal = lazy(loadContactModal);
const HomePage = lazy(() => import("./components/HomePage"));

export default function App() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [hasOpenedContactModal, setHasOpenedContactModal] = useState(false);
  const { pathname, search } = useLocation();
  const { pending } = useSiteNavigation();
  const pageRoute = resolveStandalonePage(pathname);
  const pageSeo = resolveSeoPage(pathname);

  useEffect(() => {
    if (!pageSeo && !pageRoute) {
      document.title = pathname === "/tools/prl-mining" ? "计算器已下线 - 成都显卡一号店" : "页面未找到 - 成都显卡一号店";
      const robots = document.querySelector('meta[name="robots"]') ?? document.head.appendChild(document.createElement("meta"));
      robots.setAttribute("name", "robots");
      robots.setAttribute("content", "noindex,follow");
      document.querySelector('link[rel="canonical"]')?.remove();
      return;
    }
    document.title = pageSeo?.title ?? pageRoute!.title;
    const canonicalPath = pathname.replace(/\/+$/, "") || "/";
    const canonicalUrl = `https://cdgpu.cn${canonicalPath === "/gpu-sn" ? "/gpu-sn.php" : canonicalPath}`;
    const description = pageSeo?.description ?? "显卡选购、装机配置、二手检测与故障排查交流。";
    const robots = document.querySelector('meta[name="robots"]') ?? document.head.appendChild(document.createElement("meta"));
    robots.setAttribute("name", "robots");
    robots.setAttribute("content", "index,follow");
    const metadata = [
      ['meta[name="description"]', "name", "description", description],
      ['meta[property="og:title"]', "property", "og:title", document.title],
      ['meta[property="og:description"]', "property", "og:description", description],
      ['meta[property="og:url"]', "property", "og:url", canonicalUrl],
    ];
    for (const [selector, attribute, name, content] of metadata) {
      const element = document.querySelector(selector) ?? document.head.appendChild(document.createElement("meta"));
      element.setAttribute(attribute, name);
      element.setAttribute("content", content);
    }
    const canonical = document.querySelector('link[rel="canonical"]') ?? document.head.appendChild(document.createElement("link"));
    canonical.setAttribute("rel", "canonical");
    canonical.setAttribute("href", canonicalUrl);
    // Preserve the initial server schema; replace it only when it belongs to another page.
    document.querySelectorAll('script[data-seo-page]').forEach(element => {
      const sourcePath = element.getAttribute("data-seo-page") ?? "";
      if ((sourcePath.startsWith("/") ? sourcePath : `/${sourcePath}`) === canonicalPath) return;
      element.setAttribute("data-seo-page", canonicalPath);
      element.textContent = JSON.stringify({
        "@context": "https://schema.org", "@type": "WebPage", url: canonicalUrl,
        name: document.title, description,
        isPartOf: { "@type": "WebSite", name: "成都显卡一号店", url: "https://cdgpu.cn/" },
      });
    });
  }, [pageRoute, pageSeo, pathname]);

  const handleOpenContact = (event: ConversionEvent = "wechat_estimate") => {
    trackConversion(event);
    setHasOpenedContactModal(true);
    setIsContactOpen(true);
  };
  const isKnownPage = pathname === "/" || Boolean(pageSeo || pageRoute);

  return (
    <>
      <div className={`min-h-screen flex flex-col font-sans text-slate-800 antialiased ${!pageRoute || pageRoute.id === "build" ? "bg-white pb-[calc(3.75rem+env(safe-area-inset-bottom))] sm:pb-0 selection:bg-blue-500/25 selection:text-blue-900" : "bg-slate-50"}`}>
        <Header onOpenContact={handleOpenContact} />
        {pending && <div role="status" aria-live="polite" className="fixed inset-x-0 top-16 z-50 h-0.5 bg-blue-600 sm:top-20"><span className="sr-only">正在切换页面</span></div>}
        <RouteErrorBoundary resetKey={pathname + search}>
          <Suspense fallback={<div className="flex-1 pt-16 sm:pt-20"><SectionFallback label={pageRoute?.fallbackLabel ?? "首页"} minHeight="calc(100dvh - 80px)" /></div>}>
            <RouteViewport>
              {pageRoute ? (
                <StandalonePage key={pageRoute.id === "community" ? pageRoute.id : pathname + search} route={pageRoute} onOpenContact={handleOpenContact} />
              ) : isKnownPage ? <HomePage onOpenContact={handleOpenContact} /> : (
                <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
                  <p className="text-sm font-semibold text-blue-700">{pathname === "/tools/prl-mining" ? "工具已下线" : "404"}</p>
                  <h1 className="mt-3 text-2xl font-bold text-slate-950">{pathname === "/tools/prl-mining" ? "该计算器已下线" : "没有找到这个页面"}</h1>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">{pathname === "/tools/prl-mining" ? "本站已移除相关计算与行情服务。" : "链接可能已失效，或页面地址输入有误。"}</p>
                  <div className="mt-6 flex gap-3">
                    <a href="/" className="inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white">返回首页</a>
                    <a href="/tools" className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">查看硬件工具</a>
                  </div>
                </main>
              )}
              <PageQuestions pathname={pathname} />
              <Footer compact={!!pageRoute && pageRoute.id !== "build"} />
              {(!pageRoute || pageRoute.id === "build") && <FloatingContactButton onOpenContact={handleOpenContact} />}
            </RouteViewport>
          </Suspense>
        </RouteErrorBoundary>
      </div>
      {hasOpenedContactModal && (
        <Suspense fallback={<ContactModalFallback />}>
          <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
