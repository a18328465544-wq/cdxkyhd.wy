import React, { useState } from 'react';
import { motion } from 'motion/react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import PriceSection from './components/PriceSection';
import InventorySection from './components/InventorySection';
import PcBuilderSection from './components/PcBuilderSection';
import ProcessSection from './components/ProcessSection';
import AdvantageSection from './components/AdvantageSection';
import AiWorkstationSection from './components/AiWorkstationSection';
import CaseSection from './components/CaseSection';
import GallerySection from './components/GallerySection';
import FAQSection from './components/FAQSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import FloatingContactButton from './components/FloatingContactButton';
import ContactModal from './components/ContactModal';

// Reusable elegant scroll reveal transition component
function ScrollReveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -50px 0px" }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }} // smooth, high-end easeOutCubic
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  const handleOpenContact = () => {
    setIsContactOpen(true);
  };

  const handleCloseContact = () => {
    setIsContactOpen(false);
  };

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
        
        <ScrollReveal>
          <PriceSection onOpenContact={handleOpenContact} />
        </ScrollReveal>

        <ScrollReveal>
          <InventorySection />
        </ScrollReveal>

        <ScrollReveal>
          <PcBuilderSection />
        </ScrollReveal>
        
        <ScrollReveal>
          <ProcessSection />
        </ScrollReveal>
        
        <ScrollReveal>
          <AdvantageSection />
        </ScrollReveal>
        
        <ScrollReveal>
          <AiWorkstationSection onOpenContact={handleOpenContact} />
        </ScrollReveal>
        
        <ScrollReveal>
          <CaseSection />
        </ScrollReveal>
        
        <ScrollReveal>
          <GallerySection />
        </ScrollReveal>
        
        <ScrollReveal>
          <FAQSection />
        </ScrollReveal>
        
        <ScrollReveal>
          <ContactSection onOpenContact={handleOpenContact} />
        </ScrollReveal>
      </main>

      {/* 3. Footer Statement footprint */}
      <Footer />

      {/* 4. Floating quick dock */}
      <FloatingContactButton onOpenContact={handleOpenContact} />

      {/* 5. Contact / Estimation modal trigger */}
      <ContactModal isOpen={isContactOpen} onClose={handleCloseContact} />

    </div>
  );
}
