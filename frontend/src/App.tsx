import { Suspense, lazy, useEffect, useState } from "react";
import { ContactModalFallback, SectionFallback } from "./components/PageLoading";
import { resolveStandalonePage } from "./routes/pageRoutes";
import StandalonePage from "./routes/StandalonePage";
import { resolveSeoPage } from "@cdxkyhd/shared";

const loadContactModal = () => import("./components/ContactModal");
const ContactModal = lazy(loadContactModal);
const HomePage = lazy(() => import("./components/HomePage"));

export default function App() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [hasOpenedContactModal, setHasOpenedContactModal] = useState(false);
  const pageRoute = resolveStandalonePage(window.location.pathname);
  const pageSeo = resolveSeoPage(window.location.pathname);

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
        <Suspense fallback={<SectionFallback label="首页" minHeight="780px" />}>
          <HomePage onOpenContact={handleOpenContact} />
        </Suspense>
      )}
      {hasOpenedContactModal && (
        <Suspense fallback={<ContactModalFallback />}>
          <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
