import React, { useState } from 'react';
import { FAQ_DATA } from '../data';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SectionHeader from './ui/SectionHeader';

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="border-t border-slate-200 bg-white py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-16 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-4">
          <SectionHeader
            eyebrow="常见问题"
            title="交易前你可能想问"
            description={<>寄卡安全、报价准不准、能不能到店，这里都有答案。没找到的，直接微信问我们。</>}
          />
        </div>

        <div className="divide-y divide-slate-200 border-y border-slate-200 lg:col-span-8">
          {FAQ_DATA.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={faq.q}>
                <button
                  id={`faq-toggle-${idx}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="group flex w-full cursor-pointer items-start justify-between gap-6 py-6 text-left"
                >
                  <span className="text-base font-semibold leading-7 text-slate-950 transition-colors group-hover:text-blue-700 sm:text-lg">
                    {faq.q}
                  </span>
                  <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 ring-slate-300 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-45 text-blue-700 ring-blue-300' : ''}`}>
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${idx}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-3xl pb-6 pr-12 text-base leading-7 text-slate-600">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
