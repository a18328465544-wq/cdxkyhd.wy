import React from 'react';
import { AI_STATIONS_DATA } from '../data';
import { CheckCircle2, ChevronRight, Terminal } from 'lucide-react';
import { Button } from './ui/controls';
import SectionHeader from './ui/SectionHeader';

interface AiWorkstationSectionProps {
  onOpenContact: () => void;
}

export default function AiWorkstationSection({ onOpenContact }: AiWorkstationSectionProps) {
  return (
    <section className="border-t border-slate-200 bg-slate-50 py-16 text-slate-800 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="AI 工作站"
          title="本地大模型与 AI 绘图主机"
          description="跑本地大模型、ComfyUI 工作流、剪辑渲染或深度学习训练，按你的模型规模和预算配齐散热、电源与多卡方案。"
        />

        {/* 3 Columns detailing Tiers */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {AI_STATIONS_DATA.map((tier) => (
            <div
              key={tier.id}
              className={`flex flex-col justify-between rounded-lg bg-white p-5 sm:p-6 ${
                tier.popular
                  ? 'ring-2 ring-blue-600 shadow-[0_24px_60px_-30px_rgba(37,99,235,0.45)]'
                  : 'ring-1 ring-slate-200'
              }`}
            >
              {/* Hot Popular ribbon */}
              {tier.popular && (
                <span className="mb-4 inline-flex w-fit rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
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
                    <span className="text-sm font-medium text-slate-600">方案预算参考</span>
                    <span className="font-display text-2xl font-bold tabular-nums text-slate-950">
                      {tier.budgetRange}
                    </span>
                  </div>

                  {/* Specifications items */}
                  <div className="space-y-2.5 pt-2">
                    <span className="block text-sm font-semibold text-slate-800">配置服务细项</span>
                    <ul className="space-y-2.5">
                      {tier.benefits.map((benefit, bIdx) => (
                        <li key={bIdx} className="flex gap-2 text-sm text-slate-700">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
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
            可按约定提供装机理线、驱动与环境部署，并结合实际工作负载测试。软件版本、模型规模、量化精度和上下文长度会影响显存占用与速度；具体配置、测试结果及售后以交付清单为准。
          </p>
          </div>
        </div>

      </div>
    </section>
  );
}
