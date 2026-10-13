import React from 'react';
import { AI_STATIONS_DATA } from '../data';
import { CheckCircle2, ChevronRight, Terminal, Server } from 'lucide-react';
import { Button } from './ui/controls';

interface AiWorkstationSectionProps {
  onOpenContact: () => void;
}

export default function AiWorkstationSection({ onOpenContact }: AiWorkstationSectionProps) {
  return (
    <section className="border-b border-slate-200 bg-slate-50 py-12 text-slate-800 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Module Title Section */}
        <div className="mx-auto mb-9 max-w-3xl space-y-3 text-center sm:mb-11">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <Server className="h-3.5 w-3.5" /> AI 工作站定制方案
          </span>
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            AI工作站 / 本地大模型开发主机
          </h2>
          <p className="text-sm leading-6 text-slate-600 sm:text-base">
            如果你想跑本地大模型、AI绘图、ComfyUI工作流、高强剪辑渲染或深度学习训练，我们能为您提供匹配高强度功耗散热、安静运行、多卡并联的完美组装方案。
          </p>
        </div>

        {/* 3 Columns detailing Tiers */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
          {AI_STATIONS_DATA.map((tier) => (
            <div
              key={tier.id}
              className={`flex flex-col justify-between rounded-lg border bg-white p-5 sm:p-6 ${
                tier.popular
                  ? 'border-emerald-300'
                  : 'border-slate-200'
              } transition-transform duration-300`}
            >
              {/* Hot Popular ribbon */}
              {tier.popular && (
                <span className="mb-3 inline-flex w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  推荐方案
                </span>
              )}

              <div className="space-y-6">
                
                {/* Header tier card */}
                <div className="space-y-2 border-b border-slate-200 pb-4">
                  <h3 className="text-lg font-semibold text-slate-950">
                    {tier.title}
                  </h3>
                  <p className="min-h-10 text-sm leading-5 text-slate-600">
                    {tier.subtitle}
                  </p>
                </div>

                {/* Specs highlights */}
                <div className="space-y-4">
                  
                  {/* GPU match block */}
                  <div className="rounded-lg bg-slate-50 p-3 text-sm">
                    <span className="mb-1 block text-xs font-medium text-slate-500">推荐搭配显卡</span>
                    <span className="block font-semibold leading-5 text-slate-900">
                      {tier.gpuRecommend}
                    </span>
                  </div>

                  {/* Budget box */}
                  <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 py-2">
                    <span className="text-sm font-medium text-slate-600">整机预算区间</span>
                    <span className="text-lg font-bold tabular-nums text-slate-950">
                      {tier.budgetRange}
                    </span>
                  </div>

                  {/* Specifications items */}
                  <div className="space-y-2.5 pt-2">
                    <span className="block text-sm font-semibold text-slate-800">配置服务细项</span>
                    <ul className="space-y-2.5">
                      {tier.benefits.map((benefit, bIdx) => (
                        <li key={bIdx} className="flex gap-2 text-sm text-slate-700">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                          <span className="leading-5">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

              </div>

              {/* Action triggers */}
              <Button
                id={`workstation-tier-btn-${tier.id}`}
                onClick={onOpenContact}
                variant={tier.popular ? 'primary' : 'secondary'}
                size="lg"
                className="mt-6 w-full"
              >
                定制此套配置方案
                <ChevronRight className="h-4 w-4" />
              </Button>

            </div>
          ))}
        </div>

        {/* Dynamic environmental instructions summary */}
        <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 border-t border-slate-200 pt-5 text-sm text-slate-600">
          <Terminal className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
          <div className="space-y-1">
          <span className="block font-semibold text-slate-900">门店装机与环境调校</span>
          <p className="leading-6">
            所有 AI 装机电脑均由成都最专业的极客硬件工程师亲自拼装理线。提供超长 Furmark/AIDA64 48小时压力跑机拷机压力测试，确保交到客户手中时已配备开箱可跑的 CUDA 独立显卡加速驱动与环境，享受极佳本地售后。
          </p>
          </div>
        </div>

      </div>
    </section>
  );
}
