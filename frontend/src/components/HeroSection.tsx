import React from 'react';
import { MessageSquare, Calendar, ShieldCheck, Zap, ArrowRight, Store, ChevronRight } from 'lucide-react';

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
      className="relative overflow-hidden bg-slate-50 pt-24 pb-16 lg:pt-32 lg:pb-24 border-b border-slate-100"
    >
      {/* Background radial effects */}
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-gradient-radial from-blue-100/45 to-transparent blur-3xl opacity-70" />
      <div className="absolute bottom-10 left-10 -z-10 h-[400px] w-[400px] rounded-full bg-gradient-radial from-slate-200/35 to-transparent blur-3xl opacity-60" />

      {/* Grid Pattern overlay for tech feel */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.25]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
            
            {/* Tag Badge */}
            <div
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm animate-fade-in"
            >
              <Store className="h-3.5 w-3.5 text-blue-400" />
              <span>成都本地实体门店 · 当面检测有保障</span>
            </div>

            {/* Main Headline */}
            <div
              className="space-y-2 sm:space-y-4 animate-fade-in"
              style={{ animationDelay: '80ms' }}
            >
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-5xl md:text-6xl leading-[1.12]">
                成都本地显卡回收
                <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-blue-600 via-blue-500 to-slate-900 bg-clip-text text-transparent">
                  二手交易·AI工作站装机
                </span>
              </h1>
              <p className="mx-auto lg:mx-0 max-w-2xl text-base sm:text-lg text-gray-600 font-medium leading-relaxed">
                成都显卡回收，找实体门店更放心！高端显卡、AI显卡、游戏显卡都能估。
                到店当面检测，外地顺丰支持视频验卡，确认无误后直接秒回款，坚决抵制套路压价。
              </p>
            </div>

            {/* Quick CTAs */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in"
              style={{ animationDelay: '140ms' }}
            >
              <button
                id="hero-primary-cta"
                onClick={onOpenContact}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 font-bold text-base shadow-lg shadow-blue-600/15 group transition active:scale-98 cursor-pointer"
              >
                <MessageSquare className="h-5 w-5" />
                立即微信估价
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                id="hero-secondary-cta"
                onClick={() => onScrollToSection('pricing')}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-2xl bg-white hover:bg-slate-50 text-gray-800 border border-gray-200 px-8 py-4 font-bold text-base shadow-xs transition active:scale-98 cursor-pointer"
              >
                查看今日回收行情
              </button>
            </div>

            {/* Bullets Row */}
            <div
              className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 pt-2 text-sm text-gray-500 animate-fade-in"
              style={{ animationDelay: '200ms' }}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                当面拷机检测
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Zap className="h-4 w-4 text-blue-600" />
                确认无误秒打款
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="h-4 w-4 text-blue-600" />
                信守承诺不压价
              </span>
            </div>

            {/* Stats Area */}
            <div
              className="grid grid-cols-3 gap-3 pt-6 border-t border-gray-200/80 animate-fade-in"
              style={{ animationDelay: '260ms' }}
            >
              {stats.map((stat, i) => (
                <div key={i} className="text-center lg:text-left bg-white p-3.5 rounded-xl shadow-xs border border-slate-100">
                  <div className="text-[10px] sm:text-xs font-semibold text-gray-400 block tracking-wider uppercase mb-1">
                    {stat.label}
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[10px] sm:text-xs text-blue-600 font-medium mt-0.5">
                    {stat.detail}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Graphics Column */}
          <div className="lg:col-span-5 relative">
            <div
              className="relative mx-auto max-w-[420px] lg:max-w-none rounded-3xl p-3 bg-white border border-slate-200 shadow-xl animate-scale"
            >
              {/* Apple-style neat inner card design */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 aspect-[4/3] flex flex-col justify-between group">
                
                {/* Tech glowing patterns */}
                <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-blue-500/10 blur-2xl group-hover:bg-blue-500/15 transition-all duration-700" />
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-slate-500/10 blur-xl" />

                {/* Grid wireframe effect inside card */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-35" />

                {/* Card Top Label & Badge */}
                <div className="relative flex justify-between items-start z-10">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                      高端显卡 · 二手算力交付中心
                    </h2>
                  </div>
                </div>

                {/* Center visual: Abstract representation of a graphic card PCIe structure */}
                <div className="relative z-10 my-4 flex items-center justify-center h-28">
                  <div className="relative w-full max-w-[260px] h-12 bg-slate-800/80 rounded-xl border border-slate-700/60 shadow-lg flex items-center px-4 justify-between">
                    {/* Metal shroud detail */}
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-6 bg-blue-500 rounded-xs animate-pulse" />
                      <span className="w-1.5 h-6 bg-blue-500/60 rounded-xs" />
                      <span className="w-1.5 h-6 bg-blue-500/30 rounded-xs" />
                    </div>
                    {/* Model print */}
                    <span className="font-mono text-[10px] font-bold tracking-wider text-slate-400">
                      RTX 5090 / 4090
                    </span>
                    {/* Fan spinners mockup */}
                    <div className="flex h-7 w-7 rounded-full border border-blue-500/40 items-center justify-center bg-slate-900 shadow">
                      <div className="h-5 w-5 rounded-full border-2 border-dashed border-blue-400/60 animate-spin" />
                    </div>
                  </div>

                  {/* Golden connector indicators */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[180px] h-1 bg-yellow-400/80 blur-xs" />
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[170px] h-0.5 bg-yellow-500" />
                </div>

                {/* Card Footer Location metadata */}
                <div className="relative z-10 flex justify-between items-end border-t border-slate-800/80 pt-4 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px]">物理门店地址</span>
                    <span className="text-slate-100 font-medium">新希望国际B座2507室</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 block text-[10px]">高功率测试台数</span>
                    <span className="text-blue-400 font-bold font-mono">6台测试架</span>
                  </div>
                </div>

              </div>

              {/* Float Mini Overly badge with support info */}
              <div className="absolute -bottom-5 -right-3 sm:-right-5 z-20 rounded-2xl bg-white border border-slate-200 p-4 shadow-xl max-w-[240px] animate-bounce-slow">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block font-sans">
                      新希望国际 2507
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      武侯区新希望实体店门牌
                    </span>
                  </div>
                </div>
              </div>

              {/* Left support info */}
              <div className="absolute -top-4 -left-3 sm:-left-5 z-20 rounded-xl bg-blue-600 p-3 text-white shadow-lg text-xs font-bold flex items-center gap-1.5 animate-pulse-slow">
                <span className="h-2 w-2 rounded-full bg-blue-300 animate-ping" />
                <span>限时高价加价 50-200 元</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
