import { useEffect, useState } from "react";
import { PRL_PRICE_MAX_AGE_MS, PRL_PRICE_REFRESH_MS, type PrlMarketResponse } from "@cdxkyhd/shared";
import { apiFetch } from "./api";
import { startVisiblePolling } from "./visiblePolling";

export function usePrlMarket() {
  const [market, setMarket] = useState<PrlMarketResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    return startVisiblePolling(async signal => {
      setNow(Date.now());
      setLoading(true);
      try {
        const response = await apiFetch<PrlMarketResponse>("/api/market/prl", { signal });
        if (signal.aborted) return;
        const quote = response.quote;
        if (quote && (quote.coinId !== "pearl-2" || !(quote.cny > 0) || !Number.isFinite(quote.cny) || !(quote.usd > 0) || !Number.isFinite(quote.usd) || !Number.isFinite(Date.parse(quote.updatedAt)) || Date.parse(quote.updatedAt) > Date.now() + 120_000)) {
          throw new Error("报价数据无效，请切换为手动价格。");
        }
        setMarket(response);
        setError(response.message || "");
        setNow(Date.now());
      } catch (cause) {
        if (signal.aborted) return;
        setMarket(current => current ? { ...current, status: "stale" } : null);
        setError(cause instanceof Error && cause.name !== "AbortError" ? cause.message : "行情请求超时，请稍后刷新或手动填写价格。");
      } finally {
        if (!signal.aborted) { setLoading(false); setNow(Date.now()); }
      }
    }, PRL_PRICE_REFRESH_MS);
  }, [refreshKey]);
  const candidate = market?.quote ?? null;
  const quote = candidate && now - Date.parse(candidate.updatedAt) <= 24 * 60 * 60_000 ? candidate : null;
  const fresh = market?.status === "fresh" && quote && now - Date.parse(quote.updatedAt) <= PRL_PRICE_MAX_AGE_MS;
  return { quote, fresh: Boolean(fresh), loading, error, refresh: () => setRefreshKey(current => current + 1) };
}
