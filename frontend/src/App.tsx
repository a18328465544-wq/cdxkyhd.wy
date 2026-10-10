import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import Footer from './components/Footer';
import FloatingContactButton from './components/FloatingContactButton';

const PriceSection = lazy(() => import('./components/PriceSection'));
const InventorySection = lazy(() => import('./components/InventorySection'));
const GpuSnLookupSection = lazy(() => import('./components/GpuSnLookupSection'));
const PcBuilderSection = lazy(() => import('./components/PcBuilderSection'));
const ProcessSection = lazy(() => import('./components/ProcessSection'));
const AdvantageSection = lazy(() => import('./components/AdvantageSection'));
const AiWorkstationSection = lazy(() => import('./components/AiWorkstationSection'));
const CaseSection = lazy(() => import('./components/CaseSection'));
const GallerySection = lazy(() => import('./components/GallerySection'));
const FAQSection = lazy(() => import('./components/FAQSection'));
const ContactSection = lazy(() => import('./components/ContactSection'));
const ContactModal = lazy(() => import('./components/ContactModal'));

interface LazySectionProps {
  id: string;
  label: string;
  minHeight: string;
  children: React.ReactNode;
}

function SectionFallback({ label, minHeight }: { label: string; minHeight: string }) {
  return (
    <div className="w-full bg-slate-50" style={{ minHeight }}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-100 bg-white/70 p-5 shadow-xs">
          <div className="mb-4 text-xs font-bold tracking-wider text-slate-400">{label}</div>
          <div className="h-4 w-44 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-3 w-64 max-w-full animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function ContactModalFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
      <div className="rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-700 shadow-xl">
        正在打开微信估价窗口...
      </div>
    </div>
  );
}

function LazySection({ id, label, minHeight, children }: LazySectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) return;
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: '420px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldRender]);

  return (
    <div id={id} ref={ref} style={{ minHeight }}>
      {shouldRender ? (
        <Suspense fallback={<SectionFallback label={label} minHeight={minHeight} />}>
          {children}
        </Suspense>
      ) : (
        <SectionFallback label={label} minHeight={minHeight} />
      )}
    </div>
  );
}

export default function App() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [hasOpenedContactModal, setHasOpenedContactModal] = useState(false);
  const isGpuSnPage = window.location.pathname === '/gpu-sn.php' || window.location.pathname === '/gpu-sn';

  useEffect(() => {
    if (!isGpuSnPage) return;
    const previousTitle = document.title;
    document.title = '显卡 SN 码查询生产日期 - 成都显卡一号店';
    return () => {document.title = previousTitle;};
  }, [isGpuSnPage]);

  const handleOpenContact = () => {
    setHasOpenedContactModal(true);
    setIsContactOpen(true);
  };

  const handleCloseContact = () => {
    setIsContactOpen(false);
  };

  if (isGpuSnPage) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans flex flex-col justify-between selection:bg-blue-500/25 selection:text-blue-900">
        <Header onOpenContact={handleOpenContact} />
        <main className="flex-1">
          <Suspense fallback={<SectionFallback label="显卡 SN 查询" minHeight="1000px" />}>
            <GpuSnLookupSection />
          </Suspense>
        </main>
        <Footer />
        {hasOpenedContactModal && (
          <Suspense fallback={<ContactModalFallback />}>
            <ContactModal isOpen={isContactOpen} onClose={handleCloseContact} />
          </Suspense>
        )}
      </div>
    );
  }

  const handleScrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of the sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans flex flex-col justify-between selection:bg-blue-500/25 selection:text-blue-900 pb-16 sm:pb-0">

      {/* 1. Header Navigation System */}
      <Header onOpenContact={handleOpenContact} />

      {/* 2. Page Core Structure Content modules */}
      <main className="flex-1 overflow-hidden">
        <HeroSection
          onOpenContact={handleOpenContact}
          onScrollToSection={handleScrollToSection}
        />

        <LazySection id="pricing" label="今日行情" minHeight="760px">
          <PriceSection onOpenContact={handleOpenContact} />
        </LazySection>

        <LazySection id="inventory" label="实时库存" minHeight="980px">
          <InventorySection />
        </LazySection>

        <LazySection id="pc-builder" label="在线装机" minHeight="980px">
          <PcBuilderSection />
        </LazySection>

        <LazySection id="process" label="服务流程" minHeight="420px">
          <ProcessSection />
        </LazySection>

        <LazySection id="advantages" label="门店优势" minHeight="560px">
          <AdvantageSection />
        </LazySection>

        <LazySection id="workstation" label="AI 工作站" minHeight="720px">
          <AiWorkstationSection onOpenContact={handleOpenContact} />
        </LazySection>

        <LazySection id="cases" label="客户案例" minHeight="520px">
          <CaseSection />
        </LazySection>

        <LazySection id="gallery" label="门店场景" minHeight="760px">
          <GallerySection />
        </LazySection>

        <LazySection id="faq" label="常见问题" minHeight="520px">
          <FAQSection />
        </LazySection>

        <LazySection id="contact" label="联系我们" minHeight="760px">
          <ContactSection onOpenContact={handleOpenContact} />
        </LazySection>
      </main>

      {/* 3. Footer Statement footprint */}
      <Footer />

      {/* 4. Floating quick dock */}
      <FloatingContactButton onOpenContact={handleOpenContact} />

      {/* 5. Contact / Estimation modal trigger */}
      {hasOpenedContactModal && (
        <Suspense fallback={<ContactModalFallback />}>
          <ContactModal isOpen={isContactOpen} onClose={handleCloseContact} />
        </Suspense>
      )}

    </div>
  );
}
