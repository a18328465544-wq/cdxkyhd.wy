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
    <section className="mx-auto max-w-4xl border-b border-slate-200 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      
      {/* Module Title */}
      <div className="mx-auto mb-9 max-w-3xl space-y-3 text-center sm:mb-11">
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-block">
          常见服务答疑
        </span>
        <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
          显卡回收与交易常见问题
        </h2>
        <p className="text-sm leading-6 text-slate-600 sm:text-base">
          我们尽最大诚意消除您的交易疑虑。以下整理了新老客户在显卡邮寄寄送、价格判定、到店交易及系统组装中最常提及的核心诉求解答。
        </p>
      </div>

      {/* Accordion List wrapping FAQ elements */}
      <div className="space-y-2">
        {FAQ_DATA.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className={`overflow-hidden rounded-lg border bg-white transition-colors duration-200 ${
                isOpen
                  ? 'border-blue-300'
                  : 'border-slate-200'
              }`}
            >
              
              {/* Question Clickable header */}
              <button
                id={`faq-toggle-${idx}`}
                onClick={() => toggleFAQ(idx)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left select-none group sm:px-5"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 text-xs sm:text-sm font-black font-mono">
                    问
                  </span>
                  <span className="text-sm font-semibold leading-6 text-slate-900 transition-colors group-hover:text-blue-700 sm:text-base">
                    {faq.q}
                  </span>
                </div>

                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-transform duration-300 ${
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
                    <div className="flex gap-3 border-t border-slate-100 px-4 pb-4 pt-3 text-sm leading-6 text-slate-600 sm:px-5">
                      <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-black font-mono">
                        答
                      </span>
                      <p className="flex-1 leading-6 text-slate-600">
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
