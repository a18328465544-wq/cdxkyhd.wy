import { Suspense, lazy, useEffect, useState } from "react";
import HomePage, { prefetchHomePage } from "./components/HomePage";
import { ContactModalFallback } from "./components/PageLoading";
import { resolveStandalonePage } from "./routes/pageRoutes";
import StandalonePage from "./routes/StandalonePage";
import { scrollToSectionTarget } from "./lib/navigation";
import { resolveSeoPage } from "@cdxkyhd/shared";

const loadContactModal = () => import("./components/ContactModal");
const ContactModal = lazy(loadContactModal);

export default function App() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [hasOpenedContactModal, setHasOpenedContactModal] = useState(false);
  const pageRoute = resolveStandalonePage(window.location.pathname);
  const pageSeo = resolveSeoPage(window.location.pathname);

  useEffect(() => {
    if (pageRoute && !pageRoute.prefetchHomeSections) return;

    const prefetch = () => prefetchHomePage();
    const idle = window.requestIdleCallback?.(prefetch, { timeout: 2500 }) ?? window.setTimeout(prefetch, 1200);
    const target = window.location.hash
      ? document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
      : null;
    if (target) scrollToSectionTarget(target, 80);

    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [pageRoute]);

  useEffect(() => {
    if (!pageSeo && !pageRoute) return;
    const previousTitle = document.title;
    document.title = pageSeo?.title ?? pageRoute!.title;
    return () => { document.title = previousTitle; };
  }, [pageRoute, pageSeo]);

  const handleOpenContact = () => {
    setHasOpenedContactModal(true);
    setIsContactOpen(true);
  };

  return (
    <>
      {pageRoute ? (
        <StandalonePage route={pageRoute} onOpenContact={handleOpenContact} />
      ) : (
        <HomePage onOpenContact={handleOpenContact} />
      )}
      {hasOpenedContactModal && (
        <Suspense fallback={<ContactModalFallback />}>
          <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
