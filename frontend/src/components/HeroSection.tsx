import React from 'react';
import { MessageSquare, Calendar, ShieldCheck, Zap, ArrowRight, Store, ChevronRight } from 'lucide-react';
import { Button } from './ui/controls';

interface HeroSectionProps {
  onOpenContact: () => void;
  onScrollToSection: (id: string) => void;
}

export default function HeroSection({ onOpenContact, onScrollToSection }: HeroSectionProps) {
  const stats = [
    { label: '今日估价回收', value: '32张', detail: '当面结算秒支付', color: 'text-blue-600 bg-blue-50' },
    { label: '累计服务客户', value: '3000+', detail: '好评率 99.8%', color: 'text-slate-900 bg-slate-100' },
    { label: '现场快刷秒打款', value: '10分钟内', detail: '不拖账不套路', color: 'text-blue-600 bg-blue-50' },
  ];

  return (
    <section
      id="home"
      className="border-b border-slate-200 bg-white pt-20 pb-8 max-[360px]:pt-16 sm:pb-12 lg:pt-28 lg:pb-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          
          {/* Left Text Column */}
          <div className="space-y-4 text-center sm:space-y-7 lg:col-span-7 lg:text-left">
            
            {/* Tag Badge */}
            <div
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 animate-fade-in"
            >
              <Store className="h-3.5 w-3.5 text-blue-700" />
              <span>成都本地实体门店 · 当面检测有保障</span>
            </div>

            {/* Main Headline */}
            <div
              className="space-y-2 sm:space-y-4 animate-fade-in"
              style={{ animationDelay: '80ms' }}
            >
              <h1 className="text-3xl max-[360px]:text-2xl font-bold text-slate-950 leading-[1.12] sm:text-4xl md:text-5xl lg:text-4xl xl:text-6xl">
                成都本地显卡回收
                <span className="mt-1 block text-blue-700 sm:mt-2">
                  二手交易·AI工作站装机
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-base font-normal leading-7 text-slate-600 sm:text-lg lg:mx-0">
                成都实体门店提供显卡回收、二手交易与 AI 装机。到店当面检测，外地支持顺丰寄送和视频验卡。
              </p>
            </div>

            {/* Quick CTAs */}
            <div
              className="grid grid-cols-2 items-center justify-center gap-2 sm:flex sm:gap-4 lg:justify-start animate-fade-in"
              style={{ animationDelay: '140ms' }}
            >
              <Button
                id="hero-primary-cta"
                onClick={onOpenContact}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
              >
                <MessageSquare className="h-5 w-5" />
                微信估价
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </Button>

              <Button
                id="hero-secondary-cta"
                onClick={() => onScrollToSection('pricing')}
                size="lg"
                className="w-full sm:w-auto"
              >
                今日回收行情
              </Button>
            </div>

            <p className="hidden text-center text-xs font-medium text-amber-800 lg:text-left sm:block">
              限时高价加价 50-200 元
            </p>

            {/* Bullets Row */}
            <div
              className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-slate-600 animate-fade-in max-[360px]:hidden sm:gap-x-5 sm:text-sm lg:justify-start"
              style={{ animationDelay: '200ms' }}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                当面检测
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Zap className="h-4 w-4 text-blue-700" />
                确认即付款
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="h-4 w-4 text-emerald-700" />
                价格透明
              </span>
            </div>

            {/* Stats Area */}
            <div
              className="hidden grid-cols-3 gap-2 border-t border-slate-200 pt-5 animate-fade-in sm:grid"
              style={{ animationDelay: '260ms' }}
            >
              {stats.map((stat, i) => (
                <div key={i} className={`min-w-0 border-r border-slate-200 py-2 pr-2 last:border-r-0 lg:text-left ${i === 2 ? 'max-[360px]:col-span-2 max-[360px]:border-r-0' : ''}`}>
                  <div className="text-xs font-medium text-slate-500 block mb-1">
                    {stat.label}
                  </div>
                  <div className="text-lg font-bold tabular-nums text-slate-900 sm:text-2xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 hidden text-xs text-slate-500 sm:block">
                    {stat.detail}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Graphics Column */}
          <div className="lg:col-span-5">
            <figure className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <img
                src="/images/gpu-inspection-scene.jpg"
                alt="显卡检测场景示意：在防静电工作台上检查显卡接口"
                className="aspect-[16/9] w-full object-cover sm:aspect-[4/3]"
                fetchPriority="high"
              />
              <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 sm:px-4 sm:py-3">
                <span className="font-semibold text-slate-800">硬件检测场景示意</span>
                <span>实际以门店环境为准</span>
              </figcaption>
            </figure>
          </div>

        </div>
      </div>
    </section>
  );
}
