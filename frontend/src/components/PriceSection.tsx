import React, { lazy, Suspense, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, CircleHelp, MessageSquare, Minus, RotateCcw } from 'lucide-react';
import type { GpuPrice } from '../types';
import { formatYuan, parseBasePrice } from '../lib/pricing';
import { filterRecyclingPrices, recyclingColumnTitle, recyclingModelName, recyclingSeries, recyclingVram, RECYCLING_SERIES, type RecyclingSeries } from '../lib/recyclingPrices';
import { useGpuPrices } from '../lib/useGpuPrices';
import { Button, SearchInput, SegmentedControl } from './ui/controls';

const RecyclingEstimateDialog = lazy(() => import('./RecyclingEstimateDialog'));

interface PriceSectionProps {
  onOpenContact: () => void;
  onEstimate: (model: string) => void;
}

function Trend({ trend, compact = false }: { trend: GpuPrice['trend']; compact?: boolean }) {
  const Icon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const label = trend === 'up' ? '上涨' : trend === 'down' ? '回落' : '持平';
  const tone = trend === 'up' ? 'text-red-600' : trend === 'down' ? 'text-emerald-700' : 'text-slate-500';
  return <span className={`recycling-trend ${tone}`} title={label}><Icon aria-hidden="true" /><span className={compact ? 'sr-only' : ''}>{label}</span></span>;
}

function Price({ basePrice }: { basePrice: string }) {
  const parsed = parseBasePrice(basePrice);
  if (!parsed) return <span className="text-sm font-medium text-slate-600">微信询价</span>;
  return <span className="whitespace-nowrap text-base font-bold leading-5 tabular-nums text-slate-950">
    {formatYuan(parsed.value)}{parsed.isFloor && <span className="ml-0.5 text-xs font-normal text-slate-500">起</span>}
  </span>;
}

export function RecyclingPriceTable({ prices, onEstimate }: { prices: GpuPrice[]; onEstimate: (model: string) => void }) {
  return <table className="recycling-price-table w-full table-fixed border-collapse text-left">
    <caption className="bg-slate-100 px-2 py-1 text-left text-xs font-semibold leading-5 text-slate-800">{recyclingColumnTitle(prices)}</caption>
    <colgroup><col /><col className="w-32 sm:w-28" /><col className="hidden w-16 sm:table-column" /></colgroup>
    <thead className="text-xs text-slate-500">
      <tr className="border-b border-slate-200">
        <th scope="col" className="px-2 py-1 font-normal">型号</th>
        <th scope="col" className="px-2 py-1 text-right font-normal">回收参考价</th>
        <th scope="col" className="hidden px-2 py-1 text-right font-normal sm:table-cell">走势</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {prices.map(gpu => {
        const vram = recyclingVram(gpu.specs.vram);
        return <tr key={gpu.name} data-recycling-model={gpu.name} className="group cursor-pointer transition-colors hover:bg-blue-50/50 focus-within:bg-blue-50/50" onClick={event => {
          if (!(event.target as HTMLElement).closest('button')) onEstimate(gpu.name);
        }}>
          <th scope="row" className="px-2 text-left font-normal">
            <button type="button" onClick={() => onEstimate(gpu.name)} aria-label={`估价 ${gpu.name}`} className="flex min-h-11 w-full flex-wrap items-center gap-x-2 gap-y-0.5 py-1 text-left outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-blue-600 sm:min-h-9">
              <span className="min-w-0 break-words text-sm font-semibold leading-5 text-slate-950">{recyclingModelName(gpu.name)}</span>
              {vram && <span className="text-xs leading-4 text-slate-500">{vram}</span>}
            </button>
          </th>
          <td className="px-2 py-1 text-right leading-5"><span className="inline-flex items-center justify-end gap-1"><Price basePrice={gpu.basePrice} /><span className="inline-flex sm:hidden"><Trend trend={gpu.trend} compact /></span></span></td>
          <td className="hidden px-2 py-1 text-right sm:table-cell"><Trend trend={gpu.trend} /></td>
        </tr>;
      })}
    </tbody>
  </table>;
}

export default function PriceSection({ onOpenContact, onEstimate }: PriceSectionProps) {
  const { prices, status, readAt, retry } = useGpuPrices();
  const [search, setSearch] = useState('');
  const [series, setSeries] = useState<RecyclingSeries>('all');
  const [estimateModel, setEstimateModel] = useState<string | null>(null);
  const filtered = useMemo(() => filterRecyclingPrices(prices, series, search), [prices, series, search]);
  const midpoint = Math.ceil(filtered.length / 2);
  const columns = [filtered.slice(0, midpoint), filtered.slice(midpoint)].filter(column => column.length);
  const availableSeries = RECYCLING_SERIES.filter(option => option.value === 'all' || prices.some(gpu => recyclingSeries(gpu) === option.value) || series === option.value);
  const openEstimate = (model: string) => { setEstimateModel(model); onEstimate(model); };
  const clearFilters = () => { setSeries('all'); setSearch(''); };

  return <section aria-label="显卡回收行情" className="recycling-prices border-t border-slate-200 bg-white py-4 sm:py-6">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-xl font-bold leading-7 text-slate-950 sm:text-2xl sm:leading-8">显卡回收参考价</h2>
            <span role="status" className="text-sm tabular-nums text-slate-500">{status === 'loading' ? '读取中' : status === 'error' ? '暂不可用' : `${filtered.length} 个型号`}</span>
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs leading-5 text-slate-600"><span>成色良好 · 无拆修</span><span className="text-slate-500">回收价，非出售价</span></p>
        </div>
      </div>

      <div className="mb-3 mt-3 flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:w-80 lg:shrink-0"><SearchInput aria-label="搜索显卡行情" placeholder="搜索型号，如 4090、A6000" value={search} onChange={event => setSearch(event.target.value)} /></div>
        <SegmentedControl<RecyclingSeries> className="recycling-series" label="回收显卡系列" options={availableSeries.map(option => ({ value: option.value, label: <><span className="sm:hidden">{option.value === 'other' ? '其他' : option.label.replace(/^RTX /, '')}</span><span className="hidden sm:inline">{option.label}</span></> }))} value={series} onChange={setSeries} />
      </div>

      <div aria-busy={status === 'loading'}>
        {status === 'loading' ? <div className="grid gap-4 lg:grid-cols-2" aria-label="正在读取回收行情">
          {[0, 1].map(column => <table key={column} className="w-full" aria-hidden="true"><tbody>{Array.from({ length: 8 }, (_, row) => <tr key={row} aria-hidden="true" className="h-11 border-b border-slate-100 sm:h-9"><td className="px-2"><div className="h-4 w-3/5 animate-pulse rounded bg-slate-100" /></td><td className="w-28 px-2"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>)}</tbody></table>)}
        </div> : status === 'error' || !filtered.length ? <div className="border-y border-slate-200 py-10 text-center">
          <CircleHelp className="mx-auto mb-3 h-6 w-6 text-slate-400" aria-hidden="true" />
          <p role="status" className="text-sm font-medium text-slate-800">{status === 'error' ? '行情暂时无法读取，请稍后重试' : prices.length ? '没有找到符合条件的型号' : '暂未提供回收报价'}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {status === 'error' && <Button size="sm" onClick={retry}><RotateCcw className="h-4 w-4" />重新读取</Button>}
            {status !== 'error' && (search || series !== 'all') && <Button size="sm" onClick={clearFilters}><RotateCcw className="h-4 w-4" />重置筛选</Button>}
            <Button size="sm" onClick={onOpenContact}><MessageSquare className="h-4 w-4" />微信询价</Button>
          </div>
        </div> : <div className="grid gap-y-3 lg:grid-cols-2 lg:gap-x-5" data-recycling-columns>
          {columns.map((column, index) => <RecyclingPriceTable key={index} prices={column} onEstimate={openEstimate} />)}
        </div>}
      </div>

      <div className="mt-3 flex flex-col items-start justify-between gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:items-center">
        <div className="min-w-0 text-xs leading-5 text-slate-500">
          <p>按品牌、成色、保修及检测结果确认；“起”为参考价下限。{status === 'ready' && readAt && <span className="sm:ml-2">页面读取：{new Date(readAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}，非报价更新时间。</span>}</p>
        </div>
        <Button onClick={onOpenContact} className="w-full sm:w-auto sm:shrink-0"><MessageSquare className="h-4 w-4 text-blue-600" />微信确认回收价</Button>
      </div>
    </div>
    {estimateModel && <Suspense fallback={<p role="status" className="mt-3 text-center text-sm text-slate-600">正在打开估价…</p>}>
      <RecyclingEstimateDialog model={estimateModel} gpu={status === 'ready' ? prices.find(gpu => gpu.name === estimateModel) : undefined} onClose={() => setEstimateModel(null)} onOpenContact={() => { setEstimateModel(null); onOpenContact(); }} />
    </Suspense>}
  </section>;
}
