import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { GPU_RANKING_MODEL_NAMES, type GpuRankingScoreModel, type GpuRankingScoreSnapshot } from "@cdxkyhd/shared";

export const GEEKBENCH_GPU_RANKING_SOURCE = "https://browser.geekbench.com";
export const GEEKBENCH_GPU_RANKING_VERSION = "Geekbench 7 GPU";
export const GEEKBENCH_GPU_RANKING_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

interface GeekbenchRankingServiceOptions {
  cacheFile: string;
  apiKey?: string;
  redistributionAllowed?: boolean;
  fetcher?: typeof fetch;
  modelNames?: readonly string[];
}

interface GeekbenchSearchResponse {
  data?: Array<{
    id?: number;
    is_visible?: boolean;
    created_at?: string;
    document?: {
      gpu_device_name?: string;
      gpu_platform_name?: string;
      date?: string;
      score?: number;
      valid?: number;
      complete_benchmark?: number;
    };
  }>;
}

const MAXIMUM_JSON_BYTES = 10_000_000;
const FETCH_TIMEOUT_MS = 20_000;
const RESULTS_PER_MODEL = 100;
const MINIMUM_SNAPSHOT_MODELS = 1;
const SCORE_BENCHMARKS = ["geekbenchVulkan", "geekbenchOpencl", "geekbenchCuda"] as const;

function identity(name: string) {
  const normalized = name.toUpperCase().replace(/\s+/g, " ").trim();
  const mobile = /\b(?:LAPTOP|MOBILE|MAX[ -]?Q)\b/.test(normalized);
  const rtx = normalized.match(/RTX\s*(\d{4})\s*(TI\s*SUPER|TI|SUPER|D)?/);
  const rx = normalized.match(/RX\s*(\d{4})\s*(XTX|GRE|XT)?/);
  const arc = normalized.match(/ARC\s*(B\s*\d{3})/);
  const memory = normalized.match(/\b(8|12|16|24|32)\s*(?:GB|G)\b/);
  const base = rtx
    ? `RTX${rtx[1]}${(rtx[2] ?? "").replace(/\s/g, "")}`
    : rx
      ? `RX${rx[1]}${rx[2] ?? ""}`
      : arc
        ? `ARC${arc[1].replace(/\s/g, "")}`
        : null;
  return base ? { base: `${base}${mobile ? "MOBILE" : ""}`, memoryGb: memory ? Number(memory[1]) : undefined } : null;
}

function matchingCatalogModel(sourceName: string, requestedModel: string) {
  const source = identity(sourceName);
  const requested = identity(requestedModel);
  if (!source || !requested || source.base !== requested.base) return false;
  if (requested.memoryGb === undefined) return source.memoryGb === undefined;
  return source.memoryGb === requested.memoryGb;
}

function median(values: number[]) {
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}

export function buildGeekbenchGpuSearchUrl(model: string) {
  const url = new URL("/api/v1/gpu_v7/search", GEEKBENCH_GPU_RANKING_SOURCE);
  url.searchParams.set("query", model);
  url.searchParams.set("sort_field", "created_at");
  url.searchParams.set("sort_direction", "desc");
  url.searchParams.set("page", "1");
  url.searchParams.set("per_page", String(RESULTS_PER_MODEL));
  return url;
}

export function parseGeekbenchGpuSearchJson(json: string, requestedModel: string): GpuRankingScoreModel[] {
  const payload = JSON.parse(json) as GeekbenchSearchResponse;
  if (!Array.isArray(payload.data)) throw new Error("Geekbench response format changed");

  const collected = new Map<(typeof SCORE_BENCHMARKS)[number], Map<number, number>>();
  for (const benchmark of SCORE_BENCHMARKS) collected.set(benchmark, new Map());
  for (const result of payload.data) {
    const document = result.document;
    if (
      result.is_visible !== true ||
      !Number.isInteger(result.id) ||
      !document ||
      document.valid !== 1 ||
      document.complete_benchmark !== 1 ||
      !Number.isFinite(document.score) ||
      document.score! <= 0 ||
      !document.gpu_device_name ||
      !matchingCatalogModel(document.gpu_device_name, requestedModel)
    ) continue;

    const platform = document.gpu_platform_name?.toLowerCase() ?? "";
    const benchmark = platform.includes("vulkan")
      ? "geekbenchVulkan"
      : platform.includes("opencl")
        ? "geekbenchOpencl"
        : platform.includes("cuda")
          ? "geekbenchCuda"
          : null;
    if (!benchmark) continue;
    collected.get(benchmark)!.set(result.id!, document.score!);
  }

  return SCORE_BENCHMARKS.flatMap(benchmark => {
    const scores = [...collected.get(benchmark)!.values()];
    return scores.length
      ? [{ model: requestedModel, benchmark, score: median(scores), samples: scores.length }]
      : [];
  });
}

function validateModels(models: GpuRankingScoreModel[]) {
  if (models.length < MINIMUM_SNAPSHOT_MODELS) throw new Error("Geekbench source returned no supported GPU scores");
  const keys = new Set<string>();
  for (const model of models) {
    const key = `${model.model}:${model.benchmark}`;
    if (!model.model || keys.has(key) || !SCORE_BENCHMARKS.includes(model.benchmark as (typeof SCORE_BENCHMARKS)[number])) {
      throw new Error("Geekbench source contains duplicate or invalid GPU scores");
    }
    keys.add(key);
    if (!Number.isFinite(model.score) || model.score <= 0 || model.score > 10_000_000 || !Number.isInteger(model.samples) || model.samples < 1 || model.samples > RESULTS_PER_MODEL) {
      throw new Error("Geekbench source contains invalid scores");
    }
  }
}

export class GeekbenchGpuRankingService {
  private snapshot: GpuRankingScoreSnapshot | null = null;
  private refreshInFlight: Promise<GpuRankingScoreSnapshot | null> | null = null;
  private readonly fetcher: typeof fetch;
  private readonly modelNames: readonly string[];
  private lastRefreshFailed = false;

  constructor(private readonly options: GeekbenchRankingServiceOptions) {
    this.fetcher = options.fetcher ?? fetch;
    this.modelNames = options.modelNames ?? GPU_RANKING_MODEL_NAMES;
  }

  static async open(options: GeekbenchRankingServiceOptions) {
    const service = new GeekbenchGpuRankingService(options);
    if (options.apiKey && options.redistributionAllowed) await service.readCache();
    return service;
  }

  getSnapshot() {
    return this.snapshot;
  }

  getStatus() {
    if (!this.options.apiKey) return { configured: false, reason: "缺少 Geekbench API Key" };
    if (!this.options.redistributionAllowed) return { configured: false, reason: "尚未确认 Geekbench 成绩展示授权" };
    return { configured: true, reason: this.snapshot ? "已同步" : this.lastRefreshFailed ? "同步失败，暂无有效成绩" : "正在同步" };
  }

  refresh(): Promise<GpuRankingScoreSnapshot | null> {
    if (!this.options.apiKey || !this.options.redistributionAllowed) return Promise.resolve(this.snapshot);
    if (this.refreshInFlight) return this.refreshInFlight;
    this.refreshInFlight = this.fetchAndStore().finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
  }

  private async readCache() {
    try {
      const parsed = JSON.parse(await readFile(this.options.cacheFile, "utf8")) as GpuRankingScoreSnapshot;
      if (parsed.source !== GEEKBENCH_GPU_RANKING_SOURCE || parsed.version !== GEEKBENCH_GPU_RANKING_VERSION || !Number.isFinite(Date.parse(parsed.checkedAt)) || !Number.isFinite(Date.parse(parsed.updatedAt))) return;
      validateModels(parsed.models);
      this.snapshot = parsed;
    } catch {
      this.snapshot = null;
    }
  }

  private async fetchAndStore(): Promise<GpuRankingScoreSnapshot | null> {
    try {
      const results = await this.mapModelsWithConcurrency(this.modelNames, 4, async model => {
        const response = await this.fetcher(buildGeekbenchGpuSearchUrl(model), {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${this.options.apiKey}`,
            "User-Agent": "ChengduGPUWebsite/1.0 (Geekbench Browser API sync)",
          },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (!response.ok) throw new Error(`Geekbench API returned HTTP ${response.status}`);
        const contentLength = Number(response.headers.get("content-length"));
        if (Number.isFinite(contentLength) && contentLength > MAXIMUM_JSON_BYTES) throw new Error("Geekbench response exceeded the size limit");
        const json = await response.text();
        if (Buffer.byteLength(json, "utf8") > MAXIMUM_JSON_BYTES) throw new Error("Geekbench response exceeded the size limit");
        return parseGeekbenchGpuSearchJson(json, model);
      });
      const models = results.flat();
      validateModels(models);
      const now = new Date().toISOString();
      const changed = !this.snapshot || JSON.stringify(this.snapshot.models) !== JSON.stringify(models);
      const next: GpuRankingScoreSnapshot = {
        source: GEEKBENCH_GPU_RANKING_SOURCE,
        version: GEEKBENCH_GPU_RANKING_VERSION,
        sourceUpdatedAt: null,
        checkedAt: now,
        updatedAt: changed ? now : this.snapshot!.updatedAt,
        models,
      };
      this.snapshot = next;
      this.lastRefreshFailed = false;
      await this.writeCache(next);
      return next;
    } catch (error) {
      this.lastRefreshFailed = true;
      console.warn("Geekbench GPU ranking refresh failed; keeping the last valid snapshot:", error instanceof Error ? error.message : "unknown error");
      return this.snapshot;
    }
  }

  private async mapModelsWithConcurrency<T, R>(items: readonly T[], concurrency: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
    const results = new Array<R>(items.length);
    let nextIndex = 0;
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex++;
        results[index] = await mapper(items[index]);
      }
    }));
    return results;
  }

  private async writeCache(snapshot: GpuRankingScoreSnapshot) {
    const temporaryFile = `${this.options.cacheFile}.${process.pid}.tmp`;
    try {
      await mkdir(path.dirname(this.options.cacheFile), { recursive: true });
      await writeFile(temporaryFile, JSON.stringify(snapshot), { encoding: "utf8", mode: 0o600 });
      await rename(temporaryFile, this.options.cacheFile);
    } catch (error) {
      console.warn("Geekbench GPU ranking snapshot could not be persisted:", error instanceof Error ? error.message : "unknown error");
    }
  }
}
