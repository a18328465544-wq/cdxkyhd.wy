import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ChartNoAxesCombined, ExternalLink, RefreshCw, Table2 } from "lucide-react";
import { GPU_DAILY_MODELS, type GpuPriceHistory, type GpuPriceHistoryPeriod, type GpuPricePlatform } from "@cdxkyhd/shared";
import { apiFetch } from "../lib/api";
import { startVisiblePolling } from "../lib/visiblePolling";
import { PRICE_PLATFORMS, priceHistoryLastOffer, priceHistoryMoney, priceHistorySummary } from "../lib/gpuPriceHistory";
import { Button, SegmentedControl, Select } from "./ui/controls";

const PriceChart = lazy(() => import("./GpuPriceHistoryChart"));
const modelOptions = GPU_DAILY_MODELS.map(([value, model, memory]) => ({ value, label: `${model} ${memory}GB` }));
const periods = [{ value: "7", label: "近 7 天" }, { value: "30", label: "近 30 天" }, { value: "90", label: "近 90 天" }];
const platformOptions = ["pdd", "taobao"] as const;
const time = (value: string) => new Date(value).toLocaleTimeString("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hour12: false });

export function GpuPriceHistorySummary({ summary }: { summary: ReturnType<typeof priceHistorySummary> }) {
  if (!summary.recordedDays) return null;
  return <dl className="mt-3 flex min-w-0 flex-wrap items-end justify-between gap-x-5 gap-y-2 sm:mt-4">
    <div className="min-w-0"><dt className="text-xs text-slate-500">最近采样最低价</dt>
      <dd className="mt-1 break-words text-[32px] font-bold leading-9 tabular-nums text-slate-900">{priceHistoryMoney(summary.latestCents)}</dd>
      <dd className="text-xs leading-4 text-slate-500">报价日期 {summary.latestDay}</dd>
    </div>
    <div className="space-y-1 pb-0.5 text-xs leading-5 sm:text-sm">
      {[{ label: "区间最低", cents: summary.minCents }, { label: "区间最高", cents: summary.maxCents }].map(metric => <div key={metric.label} className="flex items-baseline justify-between gap-4"><dt className="text-slate-500">{metric.label}</dt><dd className="font-medium tabular-nums text-slate-800">{priceHistoryMoney(metric.cents)}</dd></div>)}
    </div>
  </dl>;
}

export function GpuPriceHistoryPlaceholder({ state, message }: { state: "loading" | "empty" | "error" | "unselected"; message?: string }) {
  return <div role={state === "error" ? "alert" : "status"} className={`flex h-full flex-col items-center justify-center px-4 text-center ${state === "loading" ? "bg-slate-50" : ""}`}>
    {state === "loading" ? <p className="text-sm text-slate-500">正在读取历史报价…</p> : <>
      <ChartNoAxesCombined className="mb-2 h-6 w-6 text-slate-400" aria-hidden="true" />
      <p className="text-sm font-semibold text-slate-800">{state === "error" ? "历史报价暂时无法读取" : state === "unselected" ? "未选择报价平台" : "暂无有效的历史报价"}</p>
      {message && <p className="mt-1.5 max-w-md text-xs leading-5 text-slate-500">{message}</p>}
    </>}
  </div>;
}

export default function GpuPriceHistorySection({ model, onModelChange, refreshToken = 0 }: { model: string; onModelChange: (model: string) => void; refreshToken?: number }) {
  const [period, setPeriod] = useState<GpuPriceHistoryPeriod>(30);
  const [platforms, setPlatforms] = useState<readonly GpuPricePlatform[]>(platformOptions);
  const [showTable, setShowTable] = useState(false);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<{ key: string; data: GpuPriceHistory } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const key = `${model}:${period}`;
  const history = result?.key === key ? result.data : null;
  const error = failure?.key === key ? failure.message : "";

  useEffect(() => startVisiblePolling(async signal => {
    try {
      const data = await apiFetch<GpuPriceHistory>(`/api/gpu-daily/history?model=${encodeURIComponent(model)}&days=${period}`, { signal });
      if (!data.success || data.source !== "confirmed-new-retail-public-feed" || data.model.id !== model || data.period_days !== period || !Array.isArray(data.series)) throw new Error("历史报价格式无效，请稍后重试");
      if (!signal.aborted) { setResult({ key, data }); setFailure(null); }
    } catch {
      if (!signal.aborted) setFailure({ key, message: "请稍后刷新重试；无法读取的价格不会作为零价计入走势。" });
    }
  }, 60_000), [key, model, period, reload, refreshToken]);

  const summary = useMemo(() => priceHistorySummary(history, platforms), [history, platforms]);
  const label = modelOptions.find(option => option.value === model)?.label ?? "显卡";
  const rows = useMemo(() => history?.series.flatMap(day => day.offers.filter(offer => platforms.includes(offer.platform)).map(offer => ({ date: day.date, offer }))).reverse() ?? [], [history, platforms]);
  const loading = !history && !error;
  const populated = summary.recordedDays > 0;

  return <section id="gpu-daily-history" aria-labelledby="gpu-history-title" className="mt-8 min-w-0 border-y border-slate-200 py-4 sm:py-6">
    <div className="flex items-start justify-between gap-3">
      <div><h2 id="gpu-history-title" className="text-lg font-bold leading-6 text-slate-900">全新售价走势</h2><p className="mt-0.5 text-xs leading-5 text-slate-500">当日有效采样 · 人民币</p></div>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" title="查看历史明细" aria-label="查看历史明细" aria-expanded={showTable} aria-controls="gpu-history-table" onClick={() => setShowTable(value => !value)}><Table2 className="h-4 w-4" aria-hidden="true" /></Button>
        <Button size="icon" variant="ghost" title="刷新历史报价" aria-label="刷新历史报价" onClick={() => setReload(value => value + 1)}><RefreshCw className="h-4 w-4" aria-hidden="true" /></Button>
      </div>
    </div>
    <div className="gpu-price-history-toolbar mt-3 flex min-w-0 flex-wrap items-center justify-between gap-2">
      <div className="w-full min-w-0 sm:w-64"><Select aria-label="选择走势显卡型号与显存" value={model} options={modelOptions} onValueChange={onModelChange} /></div>
      <SegmentedControl label="价格趋势时间范围" value={String(period)} options={periods} onChange={value => setPeriod(Number(value) as GpuPriceHistoryPeriod)} />
    </div>
    {loading ? <div aria-hidden="true" className="mt-4 h-[76px] bg-slate-50" /> : <GpuPriceHistorySummary summary={summary} />}
    <div className="mt-3 grid min-w-0 grid-cols-2 items-center gap-x-3 sm:flex sm:flex-wrap sm:gap-x-6" role="group" aria-label="报价平台">
      {PRICE_PLATFORMS.map(platform => {
        const last = priceHistoryLastOffer(history, platform.id);
        return <label key={platform.id} className="flex min-h-10 cursor-pointer items-center gap-2 text-xs text-slate-700 sm:text-sm">
          <input type="checkbox" aria-label={platform.label} checked={platforms.includes(platform.id)} onChange={event => setPlatforms(current => event.target.checked ? [...current, platform.id] : current.filter(value => value !== platform.id))} className="h-3.5 w-3.5 accent-blue-600" />
          <span className="w-4 border-t-2" style={{ borderColor: platform.color, borderStyle: platform.id === "taobao" ? "dashed" : "solid" }} aria-hidden="true" />
          <span className="min-w-0"><span className="block leading-4 sm:inline">{platform.label}</span>{last && <span className="block text-[11px] leading-4 tabular-nums text-slate-500 sm:hidden">{priceHistoryMoney(last.offer.price_cents)}{last.date !== summary.latestDay ? ` · ${last.date.slice(5)}` : ""}</span>}</span>
        </label>;
      })}
    </div>
    <div aria-busy={loading} data-price-history-state={loading ? "loading" : populated ? "chart" : error ? "error" : "empty"} className={`min-w-0 transition-[height] duration-200 motion-reduce:transition-none ${loading || populated ? "h-[320px] sm:h-72" : "h-40"}`}>
      {loading ? <GpuPriceHistoryPlaceholder state="loading" />
        : !platforms.length ? <GpuPriceHistoryPlaceholder state="unselected" />
        : !populated ? <GpuPriceHistoryPlaceholder state={error ? "error" : "empty"} message={error || `${label}近 ${period} 天暂无有效采集记录，缺失日期不补价。`} />
        : <Suspense fallback={<GpuPriceHistoryPlaceholder state="loading" />}><PriceChart key={`${model}:${period}:${history!.series[0]?.date}`} history={history!} platforms={platforms} /></Suspense>}
    </div>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 text-[11px] leading-5 text-slate-500">
      <p>{summary.recordedDays} / {period} 天有记录{summary.recordedDays === 1 ? " · 单日采样，暂不能判断走势" : ""}</p>
      {history?.checked_at && <p title={new Date(history.checked_at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })}>最近检查 {time(history.checked_at)}</p>}
    </div>
    {error && history && <p role="alert" className="mt-2 text-sm text-amber-800">历史暂未刷新，保留上次归档数据。</p>}
    {history && history.source_status !== "ready" && <p className="mt-2 text-xs leading-6 text-amber-800">当前报价源{history.source_status === "expired" ? "已过期" : "暂不可用"}，历史记录不代表今日售价。</p>}
    <p className="mt-2 text-xs leading-5 text-slate-500">采样挂牌价，非成交价；不同商家、SKU 与优惠条件会影响价格。</p>
    {showTable && <div id="gpu-history-table" role="region" aria-label="历史报价明细" tabIndex={0} className="relative mt-5 max-w-full overflow-x-auto border-t border-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
      <table className="w-full min-w-[580px] text-left text-sm"><caption className="py-3 text-left font-semibold text-slate-800">{label} · 有效历史报价</caption>
        <thead className="text-xs text-slate-500"><tr><th className="py-3 pr-4 font-medium">日期 / 北京时间</th><th className="pr-4 font-medium">平台</th><th className="pr-4 text-right font-medium">采样最低价</th><th className="pl-4 font-medium">商家 / 优惠条件</th><th><span className="sr-only">商品链接</span></th></tr></thead>
        <tbody className="divide-y divide-slate-100">{rows.map(({ date, offer }) => <tr key={`${date}-${offer.platform}`}><td className="whitespace-nowrap py-3 pr-4 tabular-nums">{date}<span className="ml-2 text-xs text-slate-500">{time(offer.observed_at)}</span></td><td className="pr-4">{offer.platform_name}</td><td className="pr-4 text-right font-semibold tabular-nums">{priceHistoryMoney(offer.price_cents)}</td><td className="max-w-80 py-3 pl-4"><span className="block break-words">{offer.merchant}</span><span className="mt-1 block break-words text-xs text-slate-500">{offer.title}</span><span className="mt-1 block break-words text-xs text-slate-500">{offer.conditions.length ? offer.conditions.join("；") : "优惠、运费及供货情况以商家为准"}{offer.terms ? `；${offer.terms}` : ""}</span></td><td className="pl-4"><a href={offer.url} target="_blank" rel="noopener noreferrer nofollow" aria-label={`${date} ${offer.platform_name} ${offer.merchant}商品页面`} title="查看商品页面" className="inline-flex h-10 w-10 items-center justify-center text-blue-700"><ExternalLink className="h-4 w-4" aria-hidden="true" /></a></td></tr>)}</tbody>
      </table>
      {!rows.length && <p className="py-6 text-sm text-slate-500">当前范围没有有效报价记录。</p>}
    </div>}
  </section>;
}
