import React from 'react';
import { CLIENT_CASES } from '../data';
import { MessageSquare, Heart, Clock, UserCheck, Calendar } from 'lucide-react';

export default function CaseSection() {
  return (
    <section
      id="cases"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 border-b border-slate-100"
    >
      
      {/* Module Title */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-block">
          Trusted Stories · 真实交易案例
        </span>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">
          来自成都与外地的真实交易反馈
        </h2>
        <p className="text-base sm:text-lg text-gray-500 leading-relaxed font-sans">
          我们不做虚构的好评，更不买水军。以下所列全部为本周从线下门店、川内高校以及省外硬件工作室真实成交的写照，可支持后期上门溯源。
        </p>
      </div>

      {/* Grid displays client stories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {CLIENT_CASES.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xs hover:shadow-md transition duration-300 relative group"
          >
            <div className="space-y-4">
              
              {/* Story Tag and Timestamp */}
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold px-3 py-1 border border-blue-100">
                  {item.tag}
                </span>

                <span className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono">
                  <Clock className="h-3.5 w-3.5" />
                  {item.time}
                </span>
              </div>

              {/* Title story */}
              <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug tracking-tight">
                {item.title}
              </h3>

              {/* Desc content snippet */}
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-sans font-medium">
                {item.desc}
              </p>

            </div>

            {/* Simulated Verified Signature badge footer */}
            <div className="flex items-center gap-2 pt-6 mt-6 border-t border-gray-100 text-xs text-gray-400">
              <UserCheck className="h-4 w-4 text-blue-600 shrink-0" />
              <span className="font-semibold text-gray-500">成交状态：当场打款已核销</span>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
}
