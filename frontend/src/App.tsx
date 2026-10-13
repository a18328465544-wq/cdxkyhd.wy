import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import Footer from './components/Footer';
import FloatingContactButton from './components/FloatingContactButton';
import { scrollToSectionTarget } from './lib/navigation';

const homeSectionLoaders = {
  price: () => import('./components/PriceSection'),
  inventory: () => import('./components/InventorySection'),
  process: () => import('./components/ProcessSection'),
  advantage: () => import('./components/AdvantageSection'),
  cases: () => import('./components/CaseSection'),
  faq: () => import('./components/FAQSection'),
  contact: () => import('./components/ContactSection'),
};

const PriceSection = lazy(homeSectionLoaders.price);
const InventorySection = lazy(homeSectionLoaders.inventory);
const GpuSnLookupSection = lazy(() => import('./components/GpuSnLookupSection'));
const PcBuilderSection = lazy(() => import('./components/PcBuilderSection'));
const ProcessSection = lazy(homeSectionLoaders.process);
const AdvantageSection = lazy(homeSectionLoaders.advantage);
const AiWorkstationSection = lazy(() => import('./components/AiWorkstationSection'));
const CaseSection = lazy(homeSectionLoaders.cases);
const FAQSection = lazy(homeSectionLoaders.faq);
const ContactSection = lazy(homeSectionLoaders.contact);
const loadContactModal = () => import('./components/ContactModal');
const ContactModal = lazy(loadContactModal);
const CommunityPage = lazy(() => import('./components/CommunityPage'));

interface LazySectionProps {
  id: string;
  label: string;
  minHeight: string;
  children: React.ReactNode;
}

function SectionFallback({ label, minHeight }: { label: string; minHeight: string }) {
  return (
    <div className="w-full border-t border-slate-200 bg-white" style={{ minHeight }}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-sm font-semibold text-blue-700">{label}</div>
        <div className="mt-4 h-9 w-72 max-w-full animate-pulse rounded-lg bg-slate-100" />
        <div className="mt-4 h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
        <div className="mt-10 h-48 w-full animate-pulse rounded-2xl bg-slate-50" />
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
  const isCommunityPage = window.location.pathname === '/community' || window.location.pathname.startsWith('/community/');
  const isBuildPage = window.location.pathname === '/build' || window.location.pathname === '/build/';
  const [estimateModel, setEstimateModel] = useState('NVIDIA RTX 4090');

  useEffect(() => {
    if (isGpuSnPage || isCommunityPage || isBuildPage) return;
    // Fetch the below-the-fold section code while the visitor reads the hero, so
    // scrolling never lands on an empty placeholder.
    const prefetch = () => [...Object.values(homeSectionLoaders), loadContactModal].forEach(load => void load());
    const idle = window.requestIdleCallback?.(prefetch, { timeout: 2500 }) ?? window.setTimeout(prefetch, 1200);
    const target = window.location.hash ? document.getElementById(decodeURIComponent(window.location.hash.slice(1))) : null;
    if (target) scrollToSectionTarget(target, 80);
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [isGpuSnPage, isCommunityPage, isBuildPage]);

  useEffect(() => {
    if (!isBuildPage) return;
    const previousTitle = document.title;
    document.title = '装机配置与 AI 工作站 - 成都显卡一号店';
    return () => {document.title = previousTitle;};
  }, [isBuildPage]);

  useEffect(() => {
    if (!isGpuSnPage) return;
    const previousTitle = document.title;
    document.title = '显卡 SN 码查询生产日期 - 成都显卡一号店';
    return () => {document.title = previousTitle;};
  }, [isGpuSnPage]);

  useEffect(() => {
    if (!isCommunityPage) return;
    const previousTitle = document.title;
    document.title = '显卡玩家交流社区 - 成都显卡一号店';
    return () => {document.title = previousTitle;};
  }, [isCommunityPage]);

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

  if (isCommunityPage) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800 antialiased">
        <Header onOpenContact={handleOpenContact} />
        <Suspense fallback={<SectionFallback label="社区内容" minHeight="100vh" />}>
          <CommunityPage />
        </Suspense>
        <Footer />
        {hasOpenedContactModal && (
          <Suspense fallback={<ContactModalFallback />}>
            <ContactModal isOpen={isContactOpen} onClose={handleCloseContact} />
          </Suspense>
        )}
      </div>
    );
  }

  if (isBuildPage) {
    return (
      <div className="flex min-h-screen flex-col bg-white font-sans text-slate-800 antialiased selection:bg-blue-500/25 selection:text-blue-900">
        <Header onOpenContact={handleOpenContact} />
        <main className="flex-1 pt-16 sm:pt-20">
          <Suspense fallback={<SectionFallback label="在线装机" minHeight="980px" />}>
            <div id="pc-builder"><PcBuilderSection /></div>
          </Suspense>
          <Suspense fallback={<SectionFallback label="AI 工作站" minHeight="720px" />}>
            <div id="workstation"><AiWorkstationSection onOpenContact={handleOpenContact} /></div>
          </Suspense>
        </main>
        <Footer />
        <FloatingContactButton onOpenContact={handleOpenContact} />
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
    if (element) scrollToSectionTarget(element, 80);
  };

  const handleEstimate = (model: string) => {
    setEstimateModel(model);
    const estimator = document.getElementById('quick-estimator');
    if (estimator) scrollToSectionTarget(estimator, 96);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 antialiased font-sans flex flex-col justify-between selection:bg-blue-500/25 selection:text-blue-900 pb-[calc(3.75rem+env(safe-area-inset-bottom))] sm:pb-0">

      {/* 1. Header Navigation System */}
      <Header onOpenContact={handleOpenContact} />

      {/* 2. Page Core Structure Content modules */}
      <main className="flex-1 overflow-hidden">
        <HeroSection
          onOpenContact={handleOpenContact}
          onScrollToSection={handleScrollToSection}
          estimateModel={estimateModel}
          onEstimateModelChange={setEstimateModel}
        />

        <LazySection id="pricing" label="今日行情" minHeight="760px">
          <PriceSection onOpenContact={handleOpenContact} onEstimate={handleEstimate} />
        </LazySection>

        <LazySection id="inventory" label="实时库存" minHeight="760px">
          <InventorySection onOpenContact={handleOpenContact} />
        </LazySection>

        <LazySection id="process" label="服务流程" minHeight="420px">
          <ProcessSection />
        </LazySection>

        <LazySection id="advantages" label="门店优势" minHeight="560px">
          <AdvantageSection />
        </LazySection>

        <LazySection id="cases" label="客户案例" minHeight="520px">
          <CaseSection />
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
