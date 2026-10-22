export const PRL_PRICE_REFRESH_MS = 60_000;
export const PRL_PRICE_MAX_AGE_MS = 15 * 60_000;

export interface PrlMarketQuote {
  coinId: "pearl-2";
  source: "CoinGecko";
  sourceUrl: string;
  cny: number;
  usd: number;
  change24hPercent: number | null;
  updatedAt: string;
  fetchedAt: string;
}

export interface PrlMarketResponse {
  success: boolean;
  status: "fresh" | "stale" | "unavailable";
  quote: PrlMarketQuote | null;
  checkedAt: string | null;
  message: string | null;
  refreshAfterMs: number;
}
