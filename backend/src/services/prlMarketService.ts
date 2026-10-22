import { PRL_PRICE_MAX_AGE_MS, PRL_PRICE_REFRESH_MS, type PrlMarketQuote, type PrlMarketResponse } from "@cdxkyhd/shared";

const PRICE_URL = "https://api.coingecko.com/api/v3/simple/price?ids=pearl-2&vs_currencies=usd,cny&include_last_updated_at=true&include_24hr_change=true";

/** One upstream request per cache window, shared by all visitors. */
export class PrlMarketService {
  private quote: PrlMarketQuote | null = null;
  private checkedAt: string | null = null;
  private error: string | null = null;
  private nextFetchAt = 0;
  private pending: Promise<void> | null = null;

  constructor(private readonly apiKey?: string) {}

  async getPrice(): Promise<PrlMarketResponse> {
    if (Date.now() >= this.nextFetchAt) {
      if (!this.pending) {
        this.pending = this.fetchPrice().finally(() => { this.pending = null; });
      }
      await this.pending;
    }
    const quote = this.quote && Date.now() - Date.parse(this.quote.updatedAt) <= 24 * 60 * 60_000 ? this.quote : null;
    const fresh = quote && !this.error && Date.now() - Date.parse(quote.updatedAt) <= PRL_PRICE_MAX_AGE_MS;
    return {
      success: Boolean(quote), status: fresh ? "fresh" : quote ? "stale" : "unavailable",
      quote, checkedAt: this.checkedAt,
      message: this.error || (quote && !fresh ? "上游报价超过 15 分钟未更新，已停止自动用于测算。" : null),
      refreshAfterMs: PRL_PRICE_REFRESH_MS,
    };
  }

  private async fetchPrice() {
    try {
      const response = await fetch(PRICE_URL, {
        headers: { accept: "application/json", ...(this.apiKey ? { "x-cg-demo-api-key": this.apiKey } : {}) },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(response.status === 429 ? "行情接口请求受限，请稍后刷新或手动填写价格。" : "暂时无法获取 CoinGecko 报价，请稍后刷新或手动填写价格。");
      const body = await response.json() as Record<string, unknown>;
      const coin = body["pearl-2"] as Record<string, unknown> | undefined;
      const positive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
      if (!coin || !positive(coin.cny) || !positive(coin.usd) || !positive(coin.last_updated_at)) {
        throw new Error("行情接口未返回有效的 Pearl 人民币价、美元价或报价时间。");
      }
      const timestamp = coin.last_updated_at * 1000;
      if (!Number.isFinite(timestamp) || timestamp > Date.now() + 120_000 || timestamp < Date.now() - 24 * 60 * 60_000) {
        throw new Error("行情接口报价时间异常或已过期，请手动填写价格。");
      }
      this.quote = {
        coinId: "pearl-2", source: "CoinGecko", sourceUrl: "https://www.coingecko.com/en/coins/pearl-research",
        cny: coin.cny, usd: coin.usd,
        change24hPercent: typeof coin.cny_24h_change === "number" && Number.isFinite(coin.cny_24h_change) ? coin.cny_24h_change : null,
        updatedAt: new Date(timestamp).toISOString(), fetchedAt: new Date().toISOString(),
      };
      this.error = null;
      this.nextFetchAt = Date.now() + PRL_PRICE_REFRESH_MS;
    } catch (error) {
      this.error = error instanceof Error && error.name === "Error"
        ? error.message : "行情获取超时或网络不可用，请稍后刷新或手动填写价格。";
      this.nextFetchAt = Date.now() + 30_000;
    } finally {
      this.checkedAt = new Date().toISOString();
    }
  }
}
