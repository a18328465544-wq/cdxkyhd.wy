import React, { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ChartNoAxesCombined, RefreshCw, Store, Clock3, ShieldCheck } from "lucide-react";
import { emptyDailyGpuPrices, normalizeDailyGpuPrices, type DailyGpuPrices, type DailyGpuRow } from "@cdxkyhd/shared";
import { apiFetch } from "../lib/api";
import { startVisiblePolling } from "../lib/visiblePolling";
import GpuPriceHistorySection from "./GpuPriceHistorySection";
import { Button } from "./ui/controls";
import { scrollToSectionTarget } from "../lib/navigation";

const time = (at: string) => new Date(at).toLocaleTimeString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false, hour: "2-digit", minute: "2-digit" });
const money = (cents: number) => (cents / 100).toLocaleString("zh-CN", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });

export function DailyPriceCard({ row, onShowHistory }: { row: DailyGpuRow; onShowHistory?: (model: string) => void }) {
  const offer = row.lowest;
  return <article className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-bold tracking-tight text-slate-900">{row.model}</h2>
      <span className="shrink-0 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{row.memory_gb}GB</span>
    </div>
    {offer ? <>
      <div className="mt-5 text-xs text-slate-500">今日采样最低全新价</div>
      <p className="mt-1 text-4xl font-bold tracking-tight text-blue-700"><span className="mr-1 text-xl">¥</span>{money(offer.price_cents)}</p>
      <p className="mt-4 flex items-start gap-2 break-words text-sm font-semibold text-slate-800"><Store className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{offer.merchant}</p>
      <p className="mt-1 pl-6 text-xs text-slate-500">{offer.platform_name} · 北京时间 {time(offer.observed_at)} 采集</p>
      <p className="mt-3 break-words text-xs leading-5 text-slate-500">{offer.title}</p>
      <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">{offer.conditions.length ? offer.conditions.join("；") : "页面未提供明确优惠条件，券、运费及供货情况请到商家确认。"}</p>
      {row.offers.length > 1 && <div className="mt-3 space-y-1 text-xs text-slate-500">{row.offers.map(v => <p key={v.platform}>{v.platform_name}：¥{money(v.price_cents)} · {v.merchant}</p>)}</div>}
      <a href={offer.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">前往商家 <ArrowUpRight className="h-4 w-4" /></a>
    </> : <div className="mt-3 flex flex-1 flex-col justify-center rounded-xl bg-slate-50 px-4 py-4 sm:mt-5 sm:py-7">
      <p className="font-semibold text-slate-600">{row.status === "awaiting_review" ? "今日报价核对中" : "今日待更新"}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{row.status === "awaiting_review" ? "商家、显存版本和价格核对完成后展示。" : "暂无符合要求的今日全新整卡报价。"}</p>
    </div>}
    {onShowHistory && <Button variant="ghost" size="sm" className="mt-3 w-full" aria-label={`查看${row.label}历史售价`} onClick={() => onShowHistory(row.id)}><ChartNoAxesCombined className="h-4 w-4" aria-hidden="true" />价格走势</Button>}
  </article>;
}

export default function GpuDailyPage() {
  const [source, setSource] = useState<unknown>(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [reload, setReload] = useState(0);
  const [historyModel, setHistoryModel] = useState("5070ti");
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const showHistory = (model: string) => {
    setHistoryModel(model);
    const section = document.getElementById("gpu-daily-history");
    if (section) scrollToSectionTarget(section, 80);
  };
  useEffect(() => {
    return startVisiblePolling(async signal => {
      try {
        const data = await apiFetch<DailyGpuPrices>("/api/gpu-daily", { signal, cache: "no-store" });
        if (!signal.aborted) { setSource(data); setError(false); setNow(Date.now()); }
      } catch { if (!signal.aborted) { setError(true); setSource(null); } }
      finally { if (!signal.aborted) setLoading(false); }
    }, 60_000);
  }, [reload]);
  const data = useMemo(() => source ? normalizeDailyGpuPrices(source, now) : emptyDailyGpuPrices("unavailable", now), [source, now]);
  useEffect(() => {
    const timer = window.setTimeout(() => setNow(Date.now()), Math.max(1, Date.parse(data.expires_at) - Date.now()));
    const visible = () => { if (!document.hidden) setNow(Date.now()); };
    document.addEventListener("visibilitychange", visible);
    return () => { window.clearTimeout(timer); document.removeEventListener("visibilitychange", visible); };
  }, [data.expires_at]);
  const rows = data.rows.filter(v => v.label.replace(/\s/g, "").toLowerCase().includes(query.replace(/\s/g, "").toLowerCase()));
  return <main className="flex-1 pb-16 pt-20 sm:pt-32">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <a href="/" className="text-sm text-slate-500 hover:text-blue-700">首页 / 显卡日报</a>
      <div className="mt-4 flex items-start justify-between gap-3 sm:mt-6 sm:items-end sm:gap-5">
        <div><p className="text-sm font-semibold text-blue-700">RTX 50 系列 · 全新整卡</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">显卡日报</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">每天看看哪家更便宜。按型号与显存分别比较，只展示已核对的当天全新整卡报价。</p></div>
        <button type="button" aria-label="刷新报价" onClick={() => setReload(v => v + 1)} className="flex min-h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-blue-300 sm:w-auto sm:px-4"><RefreshCw className="h-4 w-4" /><span className="sr-only sm:not-sr-only">刷新报价</span></button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:mt-7 sm:grid-cols-3 sm:gap-4 sm:p-5">
        <div><p className="text-xs text-slate-500">今日 · 北京时间</p><p className="mt-1 text-lg font-bold text-slate-900">{data.date}</p></div>
        <div><p className="text-xs text-slate-500">已更新型号 / 显存版本</p><p className="mt-1 text-lg font-bold text-blue-700">{data.available_models} <span className="text-sm font-normal text-slate-500">/ {data.total_models}</span></p></div>
        <div className="col-span-2 text-xs leading-6 text-slate-600 sm:col-span-1"><p className="flex items-center gap-2"><Clock3 className="h-4 w-4" />每日更新 · 页面每分钟检查</p><p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />全新整卡 · 二手 / 工包不混入</p></div>
      </div>
      <p role="status" className="mt-5 text-sm leading-6 text-slate-600">{loading ? "正在读取今日报价…" : error ? "报价暂时读取失败，请稍后刷新。" : data.feed_status === "expired" ? "上一批报价已过期，今日报价待更新。" : !data.available_models ? data.rows.some(v => v.status === "awaiting_review") ? "今日报价暂未完成核对，核对完成后会自动显示。" : "今日暂无可发布报价，更新后会自动显示。" : "以下为已接入平台中的采样最低挂牌价；部分商品可能需登录平台查看。"}</p>
      {/* Keep reading and keyboard order aligned with the responsive visual order. */}
      {!isMobile && <GpuPriceHistorySection model={historyModel} onModelChange={setHistoryModel} refreshToken={reload} />}
      <label className="mt-5 block max-w-sm"><span className="sr-only">搜索显卡型号或显存</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索型号 / 显存，如 5060 Ti 16GB" className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm" /></label>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map(row => <DailyPriceCard key={row.id} row={row} onShowHistory={showHistory} />)}</div>
      {!rows.length && <p className="py-12 text-center text-sm text-slate-500">没有匹配的型号，请换个关键词。</p>}
      {isMobile && <GpuPriceHistorySection model={historyModel} onModelChange={setHistoryModel} refreshToken={reload} />}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 text-xs leading-6 text-slate-500"><p>价格说明：{data.scope}。具体优惠资格、税费、运费、库存和保修以商家页面及下单确认金额为准。</p><p>报价当天有效；跨日自动隐藏旧价。外部商家报价供比较，不代表本店库存或本店售价。</p></div>
    </div>
  </main>;
}
