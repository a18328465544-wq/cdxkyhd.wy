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
    <section className="bg-slate-50 py-16 sm:py-24 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Module Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-block">
            专业服务流程
          </span>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">
            成都显卡回收极速流程
          </h2>
          <p className="text-base sm:text-lg text-gray-500 leading-relaxed">
            告别传统网店漫长的审核等待和暗中克扣。我们仅需四步，即可帮您安全、专业、公开地将闲置算力变现。
          </p>
        </div>

        {/* 4 Cards Layout with nice arrows between them on desktop */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            {WORKFLOW_STEPS.map((stepItem, idx) => (
              <div
                key={idx}
                className="relative bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-xs flex flex-col justify-between group hover:shadow-md transition duration-300"
              >
                {/* Step badge top */}
                <div className="absolute -top-3 left-6 h-7 w-7 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center font-mono">
                  {stepItem.step}
                </div>

                <div className="space-y-4 mt-2">
                  <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center">
                    {icons[idx] || <MessageSquare className="h-6 w-6 text-blue-600" />}
                  </div>
                  <h3 className="text-base font-bold text-gray-905 tracking-tight">
                    {stepItem.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    {stepItem.desc}
                  </p>
                </div>

              </div>
            ))}
          </div>

          {/* Desktop background dotted line indicator */}
          <div className="hidden md:block absolute top-1/2 left-8 right-8 h-0.5 border-t border-dashed border-slate-200 -translate-y-6 -z-0" />

        </div>

        {/* Support lines for reassurance */}
        <div className="mt-12 text-center text-xs text-gray-400 font-semibold flex items-center justify-center flex-wrap gap-2">
          <span>客服微信号实时待命 · 外地全程视频监控开箱 · 成都实体店铺面对面现场支付</span>
        </div>

      </div>
    </section>
  );
}
