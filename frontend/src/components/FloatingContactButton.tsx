import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Phone, ArrowUp } from 'lucide-react';
import { CONTACT_INFO } from '../lib/contact';

interface FloatingContactButtonProps {
  onOpenContact: () => void;
}

export default function FloatingContactButton({ onOpenContact }: FloatingContactButtonProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showMobileDock, setShowMobileDock] = useState(false);
  const lastScrollY = useRef(0);
  const { phoneDisplay, phoneHref } = CONTACT_INFO;

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = Math.max(window.scrollY, 0);
      const scrollDelta = currentScrollY - lastScrollY.current;

      setShowScrollTop(currentScrollY > 400);
      if (currentScrollY < 48) {
        setShowMobileDock(false);
        lastScrollY.current = currentScrollY;
      } else if (scrollDelta > 8 || scrollDelta < -8) {
        setShowMobileDock(scrollDelta < 0);
        lastScrollY.current = currentScrollY;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {/* 1. Mobile Bottom Fixed Action Dock Bar */}
      <div
        id="mobile-action-bar"
        aria-hidden={!showMobileDock}
        className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 px-3 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+0.625rem)] shadow-2xl flex items-center gap-3 transition-transform duration-300 ${showMobileDock ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`}
      >
        <a
          href={phoneHref}
          tabIndex={showMobileDock ? 0 : -1}
          className="min-h-10 flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-2 py-2 text-xs font-bold text-blue-700 active:scale-97"
        >
          <Phone className="h-4 w-4 shrink-0" />
          电话
        </a>
        
        <button
          id="mobile-dock-wechat-btn"
          onClick={onOpenContact}
          tabIndex={showMobileDock ? 0 : -1}
          className="min-h-10 flex-[2] flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white active:scale-97 cursor-pointer"
        >
          <MessageSquare className="h-4 w-4 shrink-0" />
          微信估价
        </button>
      </div>

      {/* 2. Desktop Floating Dock (Bottom Right Actions) */}
      <div
        id="desktop-floating-dock"
        className="hidden sm:flex flex-col gap-2.5 fixed bottom-6 right-6 z-40"
      >
        {showScrollTop && (
          <button
            id="desktop-scroll-top-btn"
            onClick={scrollToTop}
            className="h-11 w-11 rounded-full bg-white hover:bg-slate-100 text-gray-500 border border-slate-200 shadow-md flex items-center justify-center transition active:scale-95 cursor-pointer animate-scale"
            title="回到顶部"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}

        <a
          id="desktop-floating-call"
          href={phoneHref}
          className="h-11 w-11 rounded-full bg-white hover:bg-slate-100 text-blue-650 border border-slate-200 shadow-md flex items-center justify-center transition active:scale-95 group relative"
          title="电话询价"
        >
          <Phone className="h-5 w-5 text-blue-500" />
          <span className="absolute right-12 scale-0 group-hover:scale-100 transition-transform origin-right bg-slate-900 text-white font-bold text-[10px] py-1 px-2.5 rounded shadow whitespace-nowrap">
            电话：{phoneDisplay}
          </span>
        </a>

        <button
          id="desktop-floating-wechat"
          onClick={onOpenContact}
          className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition active:scale-95 group relative cursor-pointer"
          title="微信秒回报价"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="absolute right-14 scale-0 group-hover:scale-100 transition-transform origin-right bg-slate-900 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow whitespace-nowrap flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            微信咨询，快速报价
          </span>
        </button>
      </div>
    </>
  );
}
