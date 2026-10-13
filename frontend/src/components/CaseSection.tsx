import React, { useState } from 'react';
import { CLIENT_CASES } from '../data';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import SectionHeader from './ui/SectionHeader';

export default function CaseSection() {
  const [expandedCases, setExpandedCases] = useState<Set<number>>(() => new Set());

  const toggle = (id: number) => setExpandedCases(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="客户案例"
          title="最近成交的几笔"
          description="门店到店、外地寄卡和工作站置换，各选一笔近期交易。"
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {CLIENT_CASES.map((item) => {
            const expanded = expandedCases.has(item.id);
            return (
              <article key={item.id} className="flex flex-col rounded-2xl bg-white p-6 ring-1 ring-slate-200 sm:p-7">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-blue-700">{item.tag}</span>
                  <span className="text-slate-400">{item.time}</span>
                </div>

                <h3 className="mt-4 text-lg font-semibold leading-7 text-slate-950">{item.title}</h3>

                <p
                  id={`case-description-${item.id}`}
                  className={`mt-3 text-base leading-7 text-slate-600 ${expanded ? '' : 'line-clamp-4'}`}
                >
                  {item.desc}
                </p>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`case-description-${item.id}`}
                  onClick={() => toggle(item.id)}
                  className="mt-2 inline-flex min-h-9 w-fit items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  {expanded ? '收起' : '展开全文'}
                  <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>

                <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  已当场付款
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
