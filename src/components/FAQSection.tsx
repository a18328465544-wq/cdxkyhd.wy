import React, { useState } from 'react';
import { FAQ_DATA } from '../data';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0); // First one open by default

  const toggleFAQ = (index: number) => {
    setOpenIdx(openIdx === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 border-b border-slate-100"
    >
      
      {/* Module Title */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-block">
          F.A.Q · 常见服务答疑
        </span>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">
          显卡回收 / 交易常见问题 FAQ
        </h2>
        <p className="text-base sm:text-lg text-gray-500 leading-relaxed font-sans">
          我们尽最大诚意消除您的交易疑虑。以下整理了新老客户在显卡邮寄寄送、价格判定、到店交易及系统组装中最常提及的核心诉求解答。
        </p>
      </div>

      {/* Accordion List wrapping FAQ elements */}
      <div className="space-y-4">
        {FAQ_DATA.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen
                  ? 'border-blue-500/30 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/5'
                  : 'border-slate-100 shadow-xs'
              }`}
            >
              
              {/* Question Clickable header */}
              <button
                id={`faq-toggle-${idx}`}
                onClick={() => toggleFAQ(idx)}
                className="w-full text-left px-5 py-4.5 sm:px-6 sm:py-5 flex items-center justify-between gap-4 select-none cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 text-xs sm:text-sm font-black font-mono">
                    Q
                  </span>
                  <span className="font-bold text-gray-900 text-sm sm:text-base leading-snug tracking-tight group-hover:text-blue-600 transition-colors">
                    {faq.q}
                  </span>
                </div>

                <div
                  className={`h-7 w-7 shrink-0 rounded-full bg-slate-50 flex items-center justify-center text-gray-500 group-hover:bg-slate-100 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-blue-600' : ''
                  }`}
                >
                  <ChevronDown className="h-4 w-4" />
                </div>
              </button>

              {/* Answer collapsed wrapper */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1 border-t border-slate-50/60 leading-relaxed text-xs sm:text-sm text-gray-500 flex gap-3">
                      <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-black font-mono">
                        A
                      </span>
                      <p className="flex-1 text-gray-600 font-medium font-sans leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          );
        })}
      </div>

    </section>
  );
}
