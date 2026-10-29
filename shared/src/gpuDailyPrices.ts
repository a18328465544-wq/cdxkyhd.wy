/** Public prices are an allowlisted snapshot, never the collector's admin state. */
import { GPU_LAUNCH_PRICES, type GpuLaunchPrice } from "./gpuLaunchPrices.js";
export const GPU_DAILY_MODELS = [
  ["5050", "RTX 5050", 8], ["5060", "RTX 5060", 8],
  ["5060ti8", "RTX 5060 Ti", 8], ["5060ti16", "RTX 5060 Ti", 16],
  ["5070", "RTX 5070", 12], ["5070ti", "RTX 5070 Ti", 16],
  ["5080", "RTX 5080", 16], ["5090", "RTX 5090", 32],
  ["5090d", "RTX 5090 D", 32], ["5090dv2", "RTX 5090 D v2", 24],
] as const;

export interface DailyGpuOffer {
  platform: "pdd" | "taobao";
  platform_name: string;
  merchant: string;
  title: string;
  price_cents: number;
  currency: "CNY";
  url: string;
  observed_at: string;
  conditions: string[];
  terms: string;
  specification?: string;
}
export interface DailyGpuRow {
  id: string;
  model: string;
  memory_gb: number;
  label: string;
  status: "available" | "awaiting_review" | "unavailable";
  lowest: DailyGpuOffer | null;
  offers: DailyGpuOffer[];
  launch_price: GpuLaunchPrice | null;
  failure_reason: string | null;
}
export interface DailyGpuPrices {
  schema_version: 1;
  date: string;
  timezone: "Asia/Shanghai";
  generated_at: string | null;
  expires_at: string;
  scope: string;
  publication_policy: "confirmed_new_retail_only" | "validated_new_retail_auto";
  available_models: number;
  total_models: number;
  feed_status: "ready" | "unavailable" | "expired" | "invalid";
  rows: DailyGpuRow[];
}
const platforms = { pdd: "拼多多", taobao: "淘宝 / 天猫" };
const scope = "当日规格、价格及店铺信息完整的全新整卡采样最低挂牌价，非全平台最低价或成交价";
export const beijingPriceDate = (now = Date.now()) => new Date(now + 8 * 3600000).toISOString().slice(0, 10);

export function emptyDailyGpuPrices(status: DailyGpuPrices["feed_status"] = "unavailable", now = Date.now()): DailyGpuPrices {
  const date = beijingPriceDate(now);
  const expires = Date.parse(`${date}T00:00:00+08:00`) + 86400000;
  return {
    schema_version: 1, date, timezone: "Asia/Shanghai", generated_at: null,
    expires_at: new Date(expires).toISOString(), scope, publication_policy: "validated_new_retail_auto",
    available_models: 0, total_models: GPU_DAILY_MODELS.length, feed_status: status,
    rows: GPU_DAILY_MODELS.map(([id, model, memory_gb]) => ({ id, model, memory_gb,
      label: `${model} ${memory_gb}GB`, status: "unavailable", lowest: null, offers: [],
      launch_price: GPU_LAUNCH_PRICES[id] ?? null, failure_reason: null })),
  };
}

type ObjectValue = Record<string, unknown>;
const object = (v: unknown): v is ObjectValue => v !== null && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max: number): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const timestamp = (v: unknown): v is string => typeof v === "string" && /(?:Z|[+-]\d{2}:\d{2})$/.test(v) && Number.isFinite(Date.parse(v));

function readOffer(value: unknown, date: string, generated: number, now: number): DailyGpuOffer | null {
  if (!object(value) || (value.platform !== "pdd" && value.platform !== "taobao") || value.currency !== "CNY"
    || !text(value.merchant, 200) || !text(value.title, 500) || !timestamp(value.observed_at)
    || !Number.isInteger(value.price_cents) || Number(value.price_cents) < 1 || Number(value.price_cents) > 100000000) return null;
  const observed = Date.parse(value.observed_at);
  if (beijingPriceDate(observed) !== date || observed > now || observed > generated) return null;
  // Exact canonical URLs only; no account parameters, redirects, credentials or arbitrary hosts.
  if (typeof value.url !== "string" || !(value.platform === "pdd"
    ? /^https:\/\/mobile\.yangkeduo\.com\/goods\.html\?goods_id=\d{1,40}$/
    : /^https:\/\/(item\.taobao\.com|detail\.tmall\.com)\/item\.htm\?id=\d{1,40}$/).test(value.url)) return null;
  const conditions = Array.isArray(value.conditions) ? value.conditions.filter((v): v is string => text(v, 200)
    && /券|优惠|包邮|运费|补贴|首件|新客|限\d+件|立减/.test(v)
    && !/https?:\/\/|token|cookie|password|账号|手机号|\d{11}/i.test(v)).slice(0, 12) : [];
  return { platform: value.platform, platform_name: platforms[value.platform], merchant: value.merchant,
    title: value.title, price_cents: Number(value.price_cents), currency: "CNY", url: value.url,
    observed_at: value.observed_at, conditions,
    specification: text(value.specification, 300) && !/https?:\/\/|token|cookie|password|账号|手机号/i.test(value.specification) ? value.specification : undefined,
    terms: "商家页面挂牌报价；优惠条件、运费及供货情况以商品页面为准" };
}

/** Used again in the browser so an already-open tab cannot show yesterday as today. */
export function normalizeDailyGpuPrices(input: unknown, now = Date.now()): DailyGpuPrices {
  const empty = emptyDailyGpuPrices("invalid", now);
  if (object(input) && input.schema_version === 1 && input.generated_at === null
    && (input.feed_status === "expired" || input.feed_status === "unavailable" || input.feed_status === "invalid")) {
    return emptyDailyGpuPrices(input.feed_status, now);
  }
  if (!object(input) || input.schema_version !== 1 || input.timezone !== "Asia/Shanghai"
    || !["confirmed_new_retail_only", "validated_new_retail_auto"].includes(String(input.publication_policy)) || !timestamp(input.generated_at)
    || !timestamp(input.expires_at) || !Array.isArray(input.rows)) return empty;
  const generated = Date.parse(input.generated_at);
  if (input.date !== empty.date || Date.parse(input.expires_at) <= now) return emptyDailyGpuPrices("expired", now);
  if (beijingPriceDate(generated) !== empty.date || generated > now
    || Date.parse(input.expires_at) !== Date.parse(empty.expires_at)) return empty;
  const rawRows = input.rows;
  const rows = empty.rows.map(row => {
    const found = rawRows.filter((v: unknown) => object(v) && v.id === row.id);
    if (found.length !== 1) return row;
    const raw = found[0] as ObjectValue;
    if (raw.model !== row.model || raw.memory_gb !== row.memory_gb) return row;
    const failure_reason = text(raw.failure_reason, 300) && !/https?:\/\/|token|cookie|password|账号|手机号|\d{11}/i.test(raw.failure_reason) ? raw.failure_reason : null;
    if (raw.status !== "available") return { ...row, failure_reason, status: raw.status === "awaiting_review" ? "awaiting_review" as const : "unavailable" as const };
    const offers: DailyGpuOffer[] = [];
    for (const candidate of Array.isArray(raw.offers) ? raw.offers.slice(0, 20) : []) {
      const offer = readOffer(candidate, empty.date, generated, now);
      if (!offer) continue;
      const previous = offers.findIndex(v => v.platform === offer.platform);
      if (previous < 0) offers.push(offer);
      else if (offers[previous].price_cents > offer.price_cents) offers[previous] = offer;
    }
    offers.sort((a, b) => a.price_cents - b.price_cents);
    return { ...row, offers, lowest: offers[0] ?? null, status: offers.length ? "available" as const : "unavailable" as const };
  });
  return { ...empty, rows, feed_status: "ready", generated_at: input.generated_at,
    available_models: rows.filter(v => v.lowest).length };
}
