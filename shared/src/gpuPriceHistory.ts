import { GPU_DAILY_MODELS, beijingPriceDate, normalizeDailyGpuPrices, type DailyGpuOffer, type DailyGpuPrices } from "./gpuDailyPrices.js";

export const GPU_PRICE_HISTORY_PERIODS = [7, 30, 90] as const;
export type GpuPriceHistoryPeriod = typeof GPU_PRICE_HISTORY_PERIODS[number];
export type GpuPricePlatform = DailyGpuOffer["platform"];
export interface GpuPriceHistoryDay { date: string; offers: DailyGpuOffer[] }
export interface GpuPriceHistory {
  success: true;
  schema_version: 1;
  model: { id: string; label: string; memory_gb: number };
  currency: "CNY";
  timezone: "Asia/Shanghai";
  source: "confirmed-new-retail-public-feed";
  source_status: DailyGpuPrices["feed_status"];
  checked_at: string | null;
  published_at: string | null;
  period_days: GpuPriceHistoryPeriod;
  series: GpuPriceHistoryDay[];
}

/** An expired daily quote is historical evidence, never a current quote. */
export function historicalGpuPriceSnapshot(input: unknown, now = Date.now()): DailyGpuPrices | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const generated = (input as { generated_at?: unknown }).generated_at;
  if (typeof generated !== "string" || !/(?:Z|[+-]\d{2}:\d{2})$/.test(generated)) return null;
  const at = Date.parse(generated);
  if (!Number.isFinite(at) || at > now) return null;
  const normalized = normalizeDailyGpuPrices(input, at);
  const rawRows = (input as { rows?: unknown }).rows;
  if (Array.isArray(rawRows) && rawRows.some(row => row && typeof row === "object" && row.status === "available"
    && normalized.rows.find(item => item.id === row.id)?.status !== "available")) return null;
  return normalized.feed_status === "ready" ? normalized : null;
}

export function gpuPriceHistoryDates(days: number, now = Date.now()): string[] {
  const end = Date.parse(`${beijingPriceDate(now)}T00:00:00Z`);
  return Array.from({ length: days }, (_, index) => new Date(end - (days - 1 - index) * 86400000).toISOString().slice(0, 10));
}

export function buildGpuPriceHistory(snapshots: readonly DailyGpuPrices[], modelId: string, days: GpuPriceHistoryPeriod, now = Date.now()): GpuPriceHistory {
  const model = GPU_DAILY_MODELS.find(([id]) => id === modelId);
  if (!model) throw new Error("Unknown GPU price history model");
  const byDay = new Map(snapshots.map(snapshot => [snapshot.date, snapshot]));
  return {
    success: true, schema_version: 1, model: { id: model[0], label: `${model[1]} ${model[2]}GB`, memory_gb: model[2] },
    currency: "CNY", timezone: "Asia/Shanghai", source: "confirmed-new-retail-public-feed",
    source_status: "unavailable", checked_at: null, published_at: null, period_days: days,
    series: gpuPriceHistoryDates(days, now).map(date => ({ date, offers: byDay.get(date)?.rows.find(row => row.id === modelId)?.offers ?? [] })),
  };
}
