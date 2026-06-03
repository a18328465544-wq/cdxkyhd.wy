import React, { useState, useEffect } from 'react';
import { MessageSquare, Phone, ArrowUp, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingContactButtonProps {
  onOpenContact: () => void;
}

export default function FloatingContactButton({ onOpenContact }: FloatingContactButtonProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
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
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 py-3 shadow-2xl flex items-center gap-3 animate-slide-up"
      >
        <a
          href="tel:18328465544"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700 active:scale-97"
        >
          <Phone className="h-4 w-4 shrink-0" />
          一键电话
        </a>
        
        <button
          id="mobile-dock-wechat-btn"
          onClick={onOpenContact}
          className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-xs font-black text-white shadow-md active:scale-97 cursor-pointer"
        >
          <MessageSquare className="h-4 w-4 shrink-0" />
          立即微信估价
          <span className="text-[9px] opacity-80 font-normal ml-0.5">秒款</span>
        </button>
      </div>

      {/* 2. Desktop Floating Dock (Bottom Right Actions) */}
      <div
        id="desktop-floating-dock"
        className="hidden sm:flex flex-col gap-2.5 fixed bottom-6 right-6 z-40"
      >
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              id="desktop-scroll-top-btn"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={scrollToTop}
              className="h-11 w-11 rounded-full bg-white hover:bg-slate-100 text-gray-500 border border-slate-200 shadow-md flex items-center justify-center transition active:scale-95 cursor-pointer"
              title="回到顶部"
            >
              <ArrowUp className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>

        <a
          id="desktop-floating-call"
          href="tel:18328465544"
          className="h-11 w-11 rounded-full bg-white hover:bg-slate-100 text-blue-650 border border-slate-200 shadow-md flex items-center justify-center transition active:scale-95 group relative"
          title="电话询价"
        >
          <Phone className="h-5 w-5 text-blue-500" />
          <span className="absolute right-12 scale-0 group-hover:scale-100 transition-transform origin-right bg-slate-900 text-white font-bold text-[10px] py-1 px-2.5 rounded shadow whitespace-nowrap">
            电话：183-2846-5544
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
            微信微信：1分钟 feedback 报价
          </span>
        </button>
      </div>
    </>
  );
}
