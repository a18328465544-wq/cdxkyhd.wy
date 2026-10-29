import type { GpuPriceHistory, GpuPricePlatform } from "@cdxkyhd/shared";

export const PRICE_PLATFORMS = [
  { id: "pdd" as const, label: "拼多多", color: "#2563eb" },
  { id: "taobao" as const, label: "淘宝 / 天猫", color: "#0f766e" },
];

export function priceHistorySummary(history: GpuPriceHistory | null, platforms: readonly GpuPricePlatform[]) {
  const days = history?.series.map(day => ({ date: day.date, offers: day.offers.filter(offer => platforms.includes(offer.platform)
    && Number.isInteger(offer.price_cents) && offer.price_cents > 0) })) ?? [];
  const populated = days.filter(day => day.offers.length);
  const prices = populated.flatMap(day => day.offers.map(offer => offer.price_cents));
  return { recordedDays: populated.length, latestDay: populated.at(-1)?.date ?? null,
    latestCents: populated.length ? Math.min(...populated.at(-1)!.offers.map(offer => offer.price_cents)) : null,
    minCents: prices.length ? Math.min(...prices) : null, maxCents: prices.length ? Math.max(...prices) : null };
}

export function priceHistoryLines(history: GpuPriceHistory, platforms: readonly GpuPricePlatform[]) {
  return PRICE_PLATFORMS.filter(platform => platforms.includes(platform.id)).map(platform => ({
    platform: platform.id, label: platform.label, color: platform.color,
    prices: history.series.map(day => {
      const cents = day.offers.find(offer => offer.platform === platform.id)?.price_cents;
      return typeof cents === "number" && Number.isInteger(cents) && cents > 0 ? cents / 100 : null;
    }),
  }));
}

export function priceHistoryLastOffer(history: GpuPriceHistory | null, platform: GpuPricePlatform) {
  for (let index = (history?.series.length ?? 0) - 1; index >= 0; index--) {
    const day = history!.series[index];
    const offer = day.offers.find(value => value.platform === platform && Number.isInteger(value.price_cents) && value.price_cents > 0);
    if (offer) return { index, date: day.date, offer };
  }
  return null;
}

export function priceHistoryTickIndices(length: number, limit: number): number[] {
  const count = Math.min(length, Math.max(2, limit));
  return count < 2 ? length ? [0] : [] : Array.from({ length: count }, (_, index) => Math.round(index * (length - 1) / (count - 1)));
}

export function priceHistoryPointRadius(prices: readonly (number | null)[], index: number) {
  if (prices[index] == null) return 0;
  return prices[index - 1] == null || prices[index + 1] == null ? 3 : 0;
}

/** Keep platform labels apart without moving either beyond the plot. */
export function priceHistoryLabelPositions(values: readonly number[], top: number, bottom: number) {
  if (!values.length) return [];
  const gap = values.length < 2 ? 0 : Math.min(52, (bottom - top) / (values.length - 1));
  const ordered = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const positions: number[] = [];
  ordered.forEach((item, index) => { positions[index] = Math.max(top, Math.min(bottom, item.value), index ? positions[index - 1] + gap : top); });
  positions[positions.length - 1] = Math.min(bottom, positions.at(-1)!);
  for (let index = positions.length - 2; index >= 0; index--) positions[index] = Math.min(positions[index], positions[index + 1] - gap);
  const result: number[] = [];
  ordered.forEach((item, index) => { result[item.index] = positions[index]; });
  return result;
}

export const priceHistoryMoney = (cents: number | null) => cents === null ? "—" : `¥${(cents / 100).toLocaleString("zh-CN", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
