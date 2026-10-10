import React from 'react';
import { AI_STATIONS_DATA } from '../data';
import { CheckCircle2, ChevronRight, MessageSquare, Terminal, Cpu, Sparkles, Server } from 'lucide-react';

interface AiWorkstationSectionProps {
  onOpenContact: () => void;
}

export default function AiWorkstationSection({ onOpenContact }: AiWorkstationSectionProps) {
  return (
    <section className="relative bg-slate-950 text-white py-16 sm:py-24 border-b border-slate-900 overflow-hidden">
      {/* Dynamic tech grid background overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />

      {/* Decorative colored glow orbs */}
      <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-10 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-3xl animate-pulse-slow" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Module Title Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 px-3.5 py-1.5 text-xs font-bold text-blue-400">
            <Server className="h-3.5 w-3.5" /> AI 工作站定制方案
          </span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
            AI工作站 / 本地大模型开发主机
          </h2>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed font-sans">
            如果你想跑本地大模型、AI绘图、ComfyUI工作流、高强剪辑渲染或深度学习训练，我们能为您提供匹配高强度功耗散热、安静运行、多卡并联的完美组装方案。
          </p>
        </div>

        {/* 3 Columns detailing Tiers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {AI_STATIONS_DATA.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 backdrop-blur-md bg-slate-900/60 border ${
                tier.popular
                  ? 'border-blue-500/60 ring-1 ring-blue-500/10 lg:scale-[1.03] lg:-translate-y-1'
                  : 'border-slate-800/80'
              } transition-transform duration-300`}
            >
              {/* Hot Popular ribbon */}
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md font-mono">
                  🔥 推荐首选配置
                </span>
              )}

              <div className="space-y-6">
                
                {/* Header tier card */}
                <div className="space-y-1.5 pb-4 border-b border-slate-800/80">
                  <h3 className="text-xl font-extrabold text-white tracking-tight">
                    {tier.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed min-h-[32px] font-medium font-sans">
                    {tier.subtitle}
                  </p>
                </div>

                {/* Specs highlights */}
                <div className="space-y-4">
                  
                  {/* GPU match block */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <span className="text-gray-400 block text-[10px] font-semibold mb-1">推荐搭配显卡</span>
                    <span className="text-blue-300 font-mono font-bold block text-sm">
                      {tier.gpuRecommend}
                    </span>
                  </div>

                  {/* Budget box */}
                  <div className="flex items-baseline justify-between py-1 border-b border-slate-800/40">
                    <span className="text-xs text-gray-400 font-semibold">整机预算区间</span>
                    <span className="text-lg font-black text-rose-400 font-mono tracking-tight">
                      {tier.budgetRange}
                    </span>
                  </div>

                  {/* Specifications items */}
                  <div className="space-y-2.5 pt-2">
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase tracking-wider">配置服务细项</span>
                    <ul className="space-y-2">
                      {tier.benefits.map((benefit, bIdx) => (
                        <li key={bIdx} className="flex gap-2 text-xs font-medium text-slate-300">
                          <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          <span className="leading-relaxed font-sans">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

              </div>

              {/* Action triggers */}
              <button
                id={`workstation-tier-btn-${tier.id}`}
                onClick={onOpenContact}
                className={`w-full flex items-center justify-center gap-1.5 rounded-2xl py-3 px-4 font-bold text-xs mt-8 transition active:scale-98 cursor-pointer ${
                  tier.popular
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                }`}
              >
                定制此套配置方案
                <ChevronRight className="h-4 w-4" />
              </button>

            </div>
          ))}
        </div>

        {/* Dynamic environmental instructions summary */}
        <div className="mt-16 text-center max-w-2xl mx-auto p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
          <Terminal className="h-5 w-5 text-blue-400 mx-auto mb-2" />
          <span className="font-bold text-gray-200 block">实体门店极速上门部署 & Cuda 环境调校</span>
          <p className="leading-relaxed font-sans">
            所有 AI 装机电脑均由成都最专业的极客硬件工程师亲自拼装理线。提供超长 Furmark/AIDA64 48小时压力跑机拷机压力测试，确保交到客户手中时已配备开箱可跑的 CUDA 独立显卡加速驱动与环境，享受极佳本地售后。
          </p>
        </div>

      </div>
    </section>
  );
}
