import React from 'react';
import { WORKFLOW_STEPS } from '../data';
import { MessageSquare, BadgeCheck, ShieldAlert, Truck, ChevronRight } from 'lucide-react';

export default function ProcessSection() {
  const icons = [
    <MessageSquare className="h-6 w-6 text-blue-600" />,
    <BadgeCheck className="h-6 w-6 text-blue-600" />,
    <Truck className="h-6 w-6 text-blue-600" />,
    <ShieldAlert className="h-6 w-6 text-blue-600" />
  ];

  return (
    <section className="border-b border-slate-200 bg-slate-50 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Module Header */}
        <div className="mx-auto mb-9 max-w-3xl space-y-3 text-center sm:mb-11">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-block">
            专业服务流程
          </span>
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            成都显卡回收极速流程
          </h2>
          <p className="text-sm leading-6 text-slate-600 sm:text-base">
            告别传统网店漫长的审核等待和暗中克扣。我们仅需四步，即可帮您安全、专业、公开地将闲置算力变现。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_STEPS.map((stepItem, idx) => (
              <div
                key={idx}
                className="flex gap-3 border-t border-slate-200 py-5 sm:px-2"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                  {stepItem.step}
                </div>

                <div className="min-w-0 space-y-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                    {icons[idx] || <MessageSquare className="h-6 w-6 text-blue-600" />}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {stepItem.title}
                  </h3>
                  <p className="text-sm leading-6 text-slate-600">
                    {stepItem.desc}
                  </p>
                </div>

              </div>
            ))}
        </div>

        {/* Support lines for reassurance */}
        <div className="mt-7 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
          <span>客服微信号实时待命 · 外地全程视频监控开箱 · 成都实体店铺面对面现场支付</span>
        </div>

      </div>
    </section>
  );
}
