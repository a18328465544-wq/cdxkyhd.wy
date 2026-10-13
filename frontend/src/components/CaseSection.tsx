import React, { useState } from 'react';
import { CLIENT_CASES } from '../data';
import { ChevronDown, Clock, UserCheck } from 'lucide-react';

export default function CaseSection() {
  const [expandedCases, setExpandedCases] = useState<Set<number>>(() => new Set());

  return (
    <section className="border-b border-slate-200 bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      
      {/* Module Title */}
      <div className="mx-auto mb-9 max-w-3xl space-y-3 text-center sm:mb-11">
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-block">
          真实交易案例
        </span>
        <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
          来自成都与外地的真实交易反馈
        </h2>
        <p className="text-sm leading-6 text-slate-600 sm:text-base">
          我们不做虚构的好评，更不买水军。以下所列全部为本周从线下门店、川内高校以及省外硬件工作室真实成交的写照，可支持后期上门溯源。
        </p>
      </div>

      {/* Grid displays client stories */}
      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-3">
        {CLIENT_CASES.map((item) => (
          <div
            key={item.id}
            className="flex min-w-0 flex-col justify-between border-t border-slate-200 py-5 md:px-3"
          >
            <div className="space-y-4">
              
              {/* Story Tag and Timestamp */}
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {item.tag}
                </span>

                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  {item.time}
                </span>
              </div>

              {/* Title story */}
              <h3 className="text-base font-semibold leading-6 text-slate-900">
                {item.title}
              </h3>

              {/* Desc content snippet */}
              <p
                id={`case-description-${item.id}`}
                className={`text-sm leading-6 text-slate-600 ${expandedCases.has(item.id) ? '' : 'line-clamp-3'}`}
              >
                {item.desc}
              </p>
              <button
                type="button"
                aria-expanded={expandedCases.has(item.id)}
                aria-controls={`case-description-${item.id}`}
                onClick={() => setExpandedCases(current => {
                  const next = new Set(current);
                  if (next.has(item.id)) next.delete(item.id);
                  else next.add(item.id);
                  return next;
                })}
                className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                {expandedCases.has(item.id) ? '收起案例' : '查看完整案例'}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedCases.has(item.id) ? 'rotate-180' : ''}`} />
              </button>

            </div>

            {/* Simulated Verified Signature badge footer */}
            <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <UserCheck className="h-4 w-4 shrink-0 text-emerald-700" />
              <span className="font-medium">成交状态：当场打款已核销</span>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
}
