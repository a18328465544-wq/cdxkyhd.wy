import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Clock, MapPin, MessageSquare, Wallet } from 'lucide-react';
import { Button, Select } from './ui/controls';
import { BRAND_OPTIONS, CONDITION_OPTIONS, estimatePayout, formatYuan, type BrandTier, type Condition } from '../lib/pricing';
import { useGpuPrices } from '../lib/useGpuPrices';

interface HeroSectionProps {
  onOpenContact: () => void;
  onScrollToSection: (id: string) => void;
  estimateModel: string;
  onEstimateModelChange: (model: string) => void;
}

const STORE_FACTS = [
  { icon: Clock, label: '营业时间', value: '每天 10:00 – 20:00' },
  { icon: MapPin, label: '门店位置', value: '地铁天府三街站 A 口' },
  { icon: Wallet, label: '付款方式', value: '微信 / 支付宝 / 银行卡' },
];

/** Store hours are 10:00–20:00 Chengdu time, every day. */
function isStoreOpen(now = new Date()): boolean {
  const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Shanghai' }).format(now));
  return hour >= 10 && hour < 20;
}

export default function HeroSection({ onOpenContact, onScrollToSection, estimateModel, onEstimateModelChange }: HeroSectionProps) {
  const prices = useGpuPrices();
  const [condition, setCondition] = useState<Condition>('perfect');
  const [brand, setBrand] = useState<BrandTier>('mid');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [storeOpen] = useState(() => isStoreOpen());

  const selectedModel = prices.some(gpu => gpu.name === estimateModel) ? estimateModel : prices[0]?.name ?? '';
  const estimate = useMemo(
    () => estimatePayout(prices.find(gpu => gpu.name === selectedModel), condition, brand),
    [prices, selectedModel, condition, brand]
  );

  return (
    <section id="home" className="relative overflow-hidden bg-white pb-10 pt-24 sm:pb-14 sm:pt-28 lg:pb-16 lg:pt-32">
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-4 sm:gap-10 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
        <div className="lg:col-span-7">
          <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
            <span className={`h-1.5 w-1.5 rounded-full ${storeOpen ? 'bg-emerald-500' : 'bg-slate-400'}`} aria-hidden="true" />
            成都武侯 · 实体门店 · {storeOpen ? '营业中' : '已打烊，可微信留言'}
          </p>

          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.15] text-slate-950 sm:text-5xl lg:text-[3.5rem]">
            显卡回收
            <span className="block text-blue-600">当面检测，当场到账</span>
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:mt-5 sm:text-lg sm:leading-8">
            RTX 50 / 40 / 30 系与 A 系列专业卡都收。成都可到店现场烤机，外地顺丰到付、视频验卡，确认无误立即转账。
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:gap-3">
            <Button id="hero-primary-cta" onClick={onOpenContact} variant="primary" size="lg" className="group px-3! sm:px-7!">
              <MessageSquare className="h-5 w-5" />
              微信估价
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 max-[400px]:hidden" />
            </Button>
            <Button id="hero-secondary-cta" onClick={() => onScrollToSection('pricing')} size="lg" className="px-3! sm:px-7!">
              看今日回收价
            </Button>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            想买卡或装机？看看
            <button type="button" onClick={() => onScrollToSection('inventory')} className="mx-1 font-medium text-blue-700 underline-offset-4 hover:underline">
              现货库存
            </button>
            或
            <a href="/build" className="ml-1 font-medium text-blue-700 underline-offset-4 hover:underline">AI 工作站方案</a>
          </p>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:mt-8 sm:grid-cols-3 sm:border-t sm:border-slate-200 sm:pt-5">
            {STORE_FACTS.map(({ icon: Icon, label, value }, index) => (
              <div key={label} className={index === 2 ? 'hidden sm:block' : ''}>
                <dt className="sr-only items-center gap-2 text-sm text-slate-600 sm:not-sr-only sm:flex">
                  <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {label}
                </dt>
                <dd className="mt-1 text-xs font-medium leading-5 text-slate-900 sm:text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-5">
          <div id="quick-estimator" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.16)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">30 秒估个价</h2>
                <p className="mt-1 text-sm text-slate-500">按今日门店回收行情计算</p>
              </div>
              <span className="shrink-0 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                限时加价 ¥50–200
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <span className="mb-2 block text-sm font-medium text-slate-700">显卡型号</span>
                <Select
                  value={selectedModel}
                  onValueChange={onEstimateModelChange}
                  options={prices.map(gpu => ({ value: gpu.name, label: gpu.name }))}
                  aria-label="选择显卡型号"
                />
              </div>

              <button type="button" aria-expanded={optionsOpen} aria-controls="estimator-options" onClick={() => setOptionsOpen(open => !open)} className="flex min-h-10 w-full items-center justify-between gap-2 text-left text-sm text-slate-700 sm:hidden">
                <span>成色与品牌 <span className="ml-1 text-xs text-slate-600">{CONDITION_OPTIONS.find(option => option.value === condition)?.label} · {BRAND_OPTIONS.find(option => option.value === brand)?.label}</span></span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${optionsOpen ? 'rotate-180' : ''}`} />
              </button>
              <div id="estimator-options" className={`${optionsOpen ? 'block' : 'hidden'} space-y-4 sm:block`}>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-700">成色</legend>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITION_OPTIONS.map(option => (
                    <Button
                      key={option.value}
                      variant="choice"
                      aria-pressed={condition === option.value}
                      onClick={() => setCondition(option.value)}
                      className="flex-col items-start! justify-start! gap-0.5! px-3! text-left! min-h-[60px]!"
                    >
                      <span className="text-sm font-semibold text-slate-900">{option.label}</span>
                      <span className="text-xs text-slate-500">{option.hint}</span>
                    </Button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-700">品牌档次</legend>
                <div className="grid grid-cols-3 gap-2">
                  {BRAND_OPTIONS.map(option => (
                    <Button
                      key={option.value}
                      variant="choice"
                      aria-pressed={brand === option.value}
                      onClick={() => setBrand(option.value)}
                      title={option.hint}
                      className="flex-col gap-0.5! px-2! min-h-[56px]!"
                    >
                      <span className="text-sm font-semibold text-slate-900">{option.label}</span>
                      <span className="text-[12px] leading-4 text-slate-500">{option.hint}</span>
                    </Button>
                  ))}
                </div>
              </fieldset>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3" aria-live="polite">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-slate-600">预估回收价</span>
                <span className="font-display text-3xl font-bold tabular-nums tracking-tight text-slate-950 sm:text-4xl">
                  {estimate ? <><span className="mr-1 text-lg font-semibold text-slate-500">约</span>{formatYuan(estimate)}</> : '微信询价'}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">检测结果与描述一致，即按此价成交。</p>
            </div>

            <Button id="calculator-wechat-btn" onClick={onOpenContact} variant="primary" size="lg" className="mt-4 w-full">
              <MessageSquare className="h-4 w-4" />
              微信锁定这个价
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
