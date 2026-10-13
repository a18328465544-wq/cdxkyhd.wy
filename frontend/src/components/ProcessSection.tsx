import React from 'react';
import { WORKFLOW_STEPS } from '../data';
import SectionHeader from './ui/SectionHeader';

export default function ProcessSection() {
  return (
    <section className="bg-slate-950 py-16 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          tone="dark"
          eyebrow="回收流程"
          title="四步完成，全程看得见"
          description="从发型号到收到钱，每一步都在你眼前完成。成都到店，外地顺丰到付。"
        />

        <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW_STEPS.map((stepItem) => (
            <li key={stepItem.step} className="bg-slate-950 p-6 sm:p-8">
              <span className="font-display text-sm font-semibold tabular-nums text-blue-300">
                {String(stepItem.step).padStart(2, '0')}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-white">{stepItem.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{stepItem.desc}</p>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-sm text-slate-400">
          客服微信实时在线 · 外地件全程视频开箱 · 成都门店当面付款
        </p>
      </div>
    </section>
  );
}
