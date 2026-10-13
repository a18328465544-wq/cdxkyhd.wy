import React, { useMemo, useState } from 'react';
import { ArrowRight, Clock, MapPin, MessageSquare, Wallet } from 'lucide-react';
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
  const [storeOpen] = useState(() => isStoreOpen());

  const selectedModel = prices.some(gpu => gpu.name === estimateModel) ? estimateModel : prices[0]?.name ?? '';
  const estimate = useMemo(
    () => estimatePayout(prices.find(gpu => gpu.name === selectedModel), condition, brand),
    [prices, selectedModel, condition, brand]
  );

  return (
    <section id="home" className="relative overflow-hidden bg-white pb-16 pt-24 sm:pt-32 lg:pb-24 lg:pt-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[640px] bg-[radial-gradient(56%_60%_at_78%_0%,rgba(37,99,235,0.10),transparent_70%)]"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
        <div className="lg:col-span-7">
          <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
            <span className={`h-1.5 w-1.5 rounded-full ${storeOpen ? 'bg-emerald-500' : 'bg-slate-400'}`} aria-hidden="true" />
            成都武侯 · 实体门店 · {storeOpen ? '营业中' : '已打烊，可微信留言'}
          </p>

          <h1 className="mt-6 font-display text-[2.5rem] font-bold leading-[1.08] tracking-tight text-slate-950 sm:text-6xl lg:text-[4.25rem]">
            显卡回收
            <span className="block text-blue-600">当面检测，当场到账</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            RTX 50 / 40 / 30 系与 A 系列专业卡都收。成都可到店现场烤机，外地顺丰到付、视频验卡，确认无误立即转账。
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button id="hero-primary-cta" onClick={onOpenContact} variant="primary" size="lg" className="group sm:px-7">
              <MessageSquare className="h-5 w-5" />
              微信估价
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button id="hero-secondary-cta" onClick={() => onScrollToSection('pricing')} size="lg" className="sm:px-7">
              看今日回收价
            </Button>
          </div>

          <p className="mt-5 text-sm text-slate-500">
            想买卡或装机？看看
            <button type="button" onClick={() => onScrollToSection('inventory')} className="mx-1 font-medium text-blue-700 underline-offset-4 hover:underline">
              现货库存
            </button>
            或
            <a href="/build" className="ml-1 font-medium text-blue-700 underline-offset-4 hover:underline">AI 工作站方案</a>
          </p>

          <dl className="mt-10 grid grid-cols-1 gap-x-8 gap-y-4 border-t border-slate-200 pt-8 sm:grid-cols-3">
            {STORE_FACTS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-3 sm:block">
                <dt className="flex items-center gap-2 text-sm text-slate-500">
                  <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {label}
                </dt>
                <dd className="text-sm font-medium text-slate-900 sm:mt-1.5">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-5">
          <div id="quick-estimator" className="scroll-mt-24 rounded-2xl bg-white p-5 shadow-[0_32px_80px_-32px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/[0.06] sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">30 秒估个价</h2>
                <p className="mt-1 text-sm text-slate-500">按今日门店回收行情计算</p>
              </div>
              <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200/80">
                限时加价 ¥50–200
              </span>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <span className="mb-2 block text-sm font-medium text-slate-700">显卡型号</span>
                <Select
                  value={selectedModel}
                  onValueChange={onEstimateModelChange}
                  options={prices.map(gpu => ({ value: gpu.name, label: gpu.name }))}
                  aria-label="选择显卡型号"
                />
              </div>

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

            <div className="mt-6 rounded-xl bg-slate-50 px-5 py-4" aria-live="polite">
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
