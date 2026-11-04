import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import HeroSection from "./HeroSection";
import PriceSection from "./PriceSection";
import InventorySection from "./InventorySection";
import { SectionFallback } from "./PageLoading";
import { scrollToSectionTarget } from "../lib/navigation";

const homeSectionLoaders = {
  process: () => import("./ProcessSection"),
  advantage: () => import("./AdvantageSection"),
  cases: () => import("./CaseSection"),
  faq: () => import("./FAQSection"),
  contact: () => import("./ContactSection"),
};

const ProcessSection = lazy(homeSectionLoaders.process);
const AdvantageSection = lazy(homeSectionLoaders.advantage);
const CaseSection = lazy(homeSectionLoaders.cases);
const FAQSection = lazy(homeSectionLoaders.faq);
const ContactSection = lazy(homeSectionLoaders.contact);

interface LazySectionProps {
  id: string;
  label: string;
  minHeight: string;
  children: React.ReactNode;
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
      { rootMargin: "420px 0px" }
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

interface HomePageProps {
  onOpenContact: () => void;
}

export default function HomePage({ onOpenContact }: HomePageProps) {
  const [estimateModel, setEstimateModel] = useState("NVIDIA RTX 4090");

  const handleScrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) scrollToSectionTarget(element, 80);
  };

  const handleEstimate = (model: string) => {
    setEstimateModel(model);
  };

  return (
      <main className="flex-1 overflow-hidden">
        <HeroSection
          onOpenContact={onOpenContact}
          onScrollToSection={handleScrollToSection}
          estimateModel={estimateModel}
          onEstimateModelChange={setEstimateModel}
        />
        <div id="pricing">
          <PriceSection onOpenContact={onOpenContact} onEstimate={handleEstimate} />
        </div>
        <div id="inventory">
          <InventorySection onOpenContact={onOpenContact} />
        </div>
        <LazySection id="process" label="服务流程" minHeight="420px"><ProcessSection /></LazySection>
        <LazySection id="advantages" label="门店优势" minHeight="560px"><AdvantageSection /></LazySection>
        <LazySection id="cases" label="客户案例" minHeight="520px"><CaseSection /></LazySection>
        <LazySection id="faq" label="常见问题" minHeight="520px"><FAQSection /></LazySection>
        <LazySection id="contact" label="联系我们" minHeight="760px">
          <ContactSection onOpenContact={onOpenContact} />
        </LazySection>
      </main>
  );
}
