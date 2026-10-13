import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, ChevronRight, Minus } from 'lucide-react';
import type { GpuPrice } from '../types';
import { formatYuan, parseBasePrice } from '../lib/pricing';
import { useGpuPrices } from '../lib/useGpuPrices';
import { SearchInput, SegmentedControl } from './ui/controls';
import SectionHeader from './ui/SectionHeader';

interface PriceSectionProps {
  onOpenContact: () => void;
  onEstimate: (model: string) => void;
}

const CATEGORY_LABEL: Record<GpuPrice['category'], string> = {
  gaming: '游戏卡',
  ai: '专业计算卡',
  both: '游戏 / AI 通用',
};

function Trend({ trend }: { trend: GpuPrice['trend'] }) {
  // Chinese market convention: up is red, down is green.
  if (trend === 'up') {
    return <span className="inline-flex items-center gap-0.5 text-sm font-medium text-red-600"><ArrowUpRight className="h-4 w-4" />上涨</span>;
  }
  if (trend === 'down') {
    return <span className="inline-flex items-center gap-0.5 text-sm font-medium text-emerald-600"><ArrowDownRight className="h-4 w-4" />回落</span>;
  }
  return <span className="inline-flex items-center gap-0.5 text-sm text-slate-400"><Minus className="h-4 w-4" />持平</span>;
}

function Price({ basePrice }: { basePrice: string }) {
  const parsed = parseBasePrice(basePrice);
  if (!parsed) return <span className="text-base font-semibold text-slate-500">微信询价</span>;
  return (
    <span className="whitespace-nowrap font-display text-lg font-bold tabular-nums tracking-tight text-slate-950 sm:text-xl">
      {formatYuan(parsed.value)}
      {parsed.isFloor && <span className="ml-1 text-sm font-medium text-slate-500">起</span>}
    </span>
  );
}

export default function PriceSection({ onOpenContact, onEstimate }: PriceSectionProps) {
  const gpuPrices = useGpuPrices();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'gaming' | 'ai'>('all');

  const filteredPrices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return gpuPrices.filter((gpu) => {
      const matchesSearch = gpu.name.toLowerCase().includes(query);
      const matchesCategory =
        activeCategory === 'all' ||
        (activeCategory === 'gaming' && (gpu.category === 'gaming' || gpu.category === 'both')) ||
        (activeCategory === 'ai' && (gpu.category === 'ai' || gpu.category === 'both'));
      return matchesSearch && matchesCategory;
    });
  }, [gpuPrices, searchQuery, activeCategory]);

  return (
    <section className="border-t border-slate-200 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="今日行情"
          title="显卡回收参考价"
          description="成色良好、无拆修显卡的门店收购价，每天更新。点任意型号，可以在页面顶部按你的成色估个价。"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SegmentedControl
            label="显卡类型"
            options={[{ value: 'all', label: '全部' }, { value: 'gaming', label: '游戏卡' }, { value: 'ai', label: 'AI 计算卡' }]}
            value={activeCategory}
            onChange={value => setActiveCategory(value)}
          />
          <div className="w-full sm:w-72">
            <SearchInput
              aria-label="搜索显卡行情"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索型号，如 4090、A6000"
            />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-slate-200">
          <table className="w-full border-collapse text-left">
            <thead className="hidden bg-slate-50 text-sm text-slate-500 sm:table-header-group">
              <tr>
                <th scope="col" className="px-6 py-3.5 font-medium">型号</th>
                <th scope="col" className="hidden px-4 py-3.5 font-medium md:table-cell">显存</th>
                <th scope="col" className="hidden px-4 py-3.5 font-medium lg:table-cell">类型</th>
                <th scope="col" className="px-4 py-3.5 font-medium">走势</th>
                <th scope="col" className="px-4 py-3.5 text-right font-medium">参考回收价</th>
                <th scope="col" className="w-28 px-6 py-3.5"><span className="sr-only">操作</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPrices.map((gpu) => (
                <tr
                  key={gpu.name}
                  onClick={() => onEstimate(gpu.name)}
                  className="group cursor-pointer bg-white transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-950">{gpu.name.replace(/^NVIDIA\s+/, '')}</span>
                      {gpu.popular && <span className="shrink-0 whitespace-nowrap rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">热门</span>}
                    </div>
                    <div className="mt-1 text-sm text-slate-500 md:hidden">
                      {gpu.specs.vram}
                      <span className="sm:hidden"> · <Trend trend={gpu.trend} /></span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-4 text-sm tabular-nums text-slate-600 md:table-cell">{gpu.specs.vram}</td>
                  <td className="hidden px-4 py-4 text-sm text-slate-600 lg:table-cell">{CATEGORY_LABEL[gpu.category]}</td>
                  <td className="hidden px-4 py-4 sm:table-cell"><Trend trend={gpu.trend} /></td>
                  <td className="px-4 py-4 text-right sm:px-4"><Price basePrice={gpu.basePrice} /></td>
                  <td className="hidden px-6 py-4 text-right sm:table-cell">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEstimate(gpu.name);
                      }}
                      className="inline-flex items-center gap-0.5 text-sm font-medium text-blue-700 opacity-70 transition group-hover:opacity-100"
                    >
                      估价<ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPrices.length === 0 && (
            <div className="bg-white px-6 py-14 text-center">
              <p className="text-base font-medium text-slate-900">没有找到这个型号</p>
              <p className="mt-2 text-sm text-slate-500">
                不在列表里的卡也收，
                <button type="button" onClick={onOpenContact} className="font-medium text-blue-700 hover:underline">微信发型号给我们</button>
                ，几分钟内报价。
              </p>
            </div>
          )}
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-500">
          「起」表示该型号的最低收购价，具体按品牌、成色、保修与当面测试结果确定。行情波动大时，建议先微信确认当日价格。
        </p>
      </div>
    </section>
  );
}
