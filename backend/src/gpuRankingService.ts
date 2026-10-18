import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import type { GpuGameMetric, GpuGameMetrics, GpuGameModel, GpuGameSnapshot } from "@cdxkyhd/shared";

export const GPU_RANKING_SOURCE = "https://www.tomshardware.com/reviews/gpu-hierarchy,4388.html";
export const GPU_RANKING_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

export type GpuBenchmarkMetric = GpuGameMetric;
export type GpuResolutionMetrics = GpuGameMetrics;
export type GpuRankingModel = GpuGameModel;
export type GpuRankingSnapshot = GpuGameSnapshot;

interface ParsedGpuRanking {
  sourceUpdatedAt: string | null;
  models: GpuRankingModel[];
}

interface GpuRankingServiceOptions {
  cacheFile: string;
  fetcher?: typeof fetch;
}

const MINIMUM_MODEL_COUNT = 40;
const MAXIMUM_HTML_BYTES = 6_000_000;
const FETCH_TIMEOUT_MS = 20_000;

function parseMetric(value: string): GpuBenchmarkMetric | null {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*%\s*\(\s*(\d+(?:\.\d+)?)\s*\)$/);
  if (!match) return null;
  const relativeScore = Number(match[1]);
  const fps = Number(match[2]);
  if (!Number.isFinite(relativeScore) || relativeScore <= 0 || relativeScore > 200 || !Number.isFinite(fps) || fps <= 0 || fps > 1000) return null;
  return { relativeScore, fps };
}

function parseRankingTable($: ReturnType<typeof load>, table: Parameters<ReturnType<typeof load>>[0], mode: "raster" | "rayTracing") {
  const rows = $(table).find("tr").toArray();
  const headers = $(rows[0]).find("th, td").map((_, cell) => $(cell).text().replace(/\s+/g, " ").trim()).get();
  if (headers.length !== 5 || headers[0] !== "Graphics Card" || headers[1] !== "MSRP" || headers[2] !== "1080p Ultra" || headers[3] !== "1440p Ultra" || headers[4] !== "4K Ultra") return null;

  const parsed = new Map<string, GpuResolutionMetrics>();
  for (const row of rows.slice(1)) {
    const cells = $(row).find("th, td").toArray();
    if (cells.length < 5) continue;
    const model = $(cells[0]).text().replace(/\s+/g, " ").trim();
    const metrics = cells.slice(2, 5).map((cell) => {
      const text = $(cell).text().trim();
      if (/^(?:N\/?A|[-–—]|Not tested)?$/i.test(text)) return null;
      const metric = parseMetric(text);
      if (!metric) throw new Error(`Invalid ${mode} GPU benchmark metric`);
      return metric;
    });
    if (!model || metrics.every((metric) => metric === null) || parsed.has(model)) {
      throw new Error(`Invalid ${mode} GPU benchmark row`);
    }
    parsed.set(model, metrics as unknown as GpuResolutionMetrics);
  }
  return parsed;
}

function validateModels(models: GpuRankingModel[]) {
  if (models.length < MINIMUM_MODEL_COUNT) throw new Error("GPU benchmark source returned too few models");
  if (models.filter(model => model.raster.some(metric => metric !== null)).length < MINIMUM_MODEL_COUNT) throw new Error("GPU raster benchmark tables are incomplete");
  const names = new Set<string>();
  for (const model of models) {
    if (!model.model || names.has(model.model)) throw new Error("GPU benchmark source contains duplicate models");
    names.add(model.model);
    for (const mode of [model.raster, model.rayTracing]) {
      if (!Array.isArray(mode) || mode.length !== 3 || mode.some((metric) => metric !== null && (!Number.isFinite(metric.fps) || metric.fps <= 0 || metric.fps > 1000 || !Number.isFinite(metric.relativeScore) || metric.relativeScore <= 0 || metric.relativeScore > 200))) {
        throw new Error("GPU benchmark source contains invalid scores");
      }
    }
  }
}

export function parseGpuRankingHtml(html: string): ParsedGpuRanking {
  const $ = load(html);
  let raster: Map<string, GpuResolutionMetrics> | null = null;
  let rayTracing: Map<string, GpuResolutionMetrics> | null = null;

  for (const table of $("table").toArray()) {
    const heading = $(table).closest(".table__container").text().replace(/\s+/g, " ").trim();
    if (heading.includes("Rasterization Performance")) raster = parseRankingTable($, table, "raster");
    if (heading.includes("Ray Tracing Performance")) rayTracing = parseRankingTable($, table, "rayTracing");
  }

  if (!raster) throw new Error("GPU benchmark tables were not found");
  if (raster.size < MINIMUM_MODEL_COUNT) throw new Error("GPU benchmark tables are incomplete");

  const models: GpuRankingModel[] = [];
  for (const [model, rasterMetrics] of raster) {
    const rayTracingMetrics = rayTracing?.get(model) ?? [null, null, null];
    models.push({ model, raster: rasterMetrics, rayTracing: rayTracingMetrics });
  }
  for (const [model, metrics] of rayTracing ?? []) {
    if (!raster.has(model)) models.push({ model, raster: [null, null, null], rayTracing: metrics });
  }
  validateModels(models);

  const modifiedAt = $("meta[property='article:modified_time']").attr("content");
  const sourceUpdatedAt = modifiedAt && Number.isFinite(Date.parse(modifiedAt)) ? new Date(modifiedAt).toISOString() : null;
  return { sourceUpdatedAt, models };
}

export class GpuRankingService {
  private snapshot: GpuRankingSnapshot | null = null;
  private refreshInFlight: Promise<GpuRankingSnapshot | null> | null = null;
  private readonly fetcher: typeof fetch;
  private lastAttemptAt: string | null = null;
  private refreshFailed = false;

  constructor(private readonly options: GpuRankingServiceOptions) {
    this.fetcher = options.fetcher ?? fetch;
  }

  static async open(options: GpuRankingServiceOptions) {
    const service = new GpuRankingService(options);
    await service.readCache();
    return service;
  }

  getSnapshot() {
    return this.snapshot;
  }

  getStatus() {
    return { available: Boolean(this.snapshot), lastAttemptAt: this.lastAttemptAt, refreshFailed: this.refreshFailed };
  }

  refresh(): Promise<GpuRankingSnapshot | null> {
    if (this.refreshInFlight) return this.refreshInFlight;
    this.refreshInFlight = this.fetchAndStore().finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
  }

  private async readCache() {
    try {
      const parsed = JSON.parse(await readFile(this.options.cacheFile, "utf8")) as GpuRankingSnapshot;
      if (parsed.source !== GPU_RANKING_SOURCE || !Array.isArray(parsed.models) || !Number.isFinite(Date.parse(parsed.checkedAt)) || !Number.isFinite(Date.parse(parsed.updatedAt))) return;
      validateModels(parsed.models);
      this.snapshot = parsed;
    } catch {
      this.snapshot = null;
    }
  }

  private async fetchAndStore(): Promise<GpuRankingSnapshot | null> {
    this.lastAttemptAt = new Date().toISOString();
    try {
      const response = await this.fetcher(GPU_RANKING_SOURCE, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "ChengduGPUWebsite/1.0 (GPU benchmark data refresh)",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`GPU benchmark source returned HTTP ${response.status}`);
      const contentLength = Number(response.headers.get("content-length"));
      if (Number.isFinite(contentLength) && contentLength > MAXIMUM_HTML_BYTES) throw new Error("GPU benchmark page exceeded the size limit");
      const html = await response.text();
      if (Buffer.byteLength(html, "utf8") > MAXIMUM_HTML_BYTES) throw new Error("GPU benchmark page exceeded the size limit");

      const parsed = parseGpuRankingHtml(html);
      const now = new Date().toISOString();
      const changed = !this.snapshot || JSON.stringify(this.snapshot.models) !== JSON.stringify(parsed.models);
      const next: GpuRankingSnapshot = {
        source: GPU_RANKING_SOURCE,
        sourceUpdatedAt: parsed.sourceUpdatedAt,
        checkedAt: now,
        updatedAt: changed ? (parsed.sourceUpdatedAt ?? now) : this.snapshot!.updatedAt,
        models: parsed.models,
      };
      this.snapshot = next;
      this.refreshFailed = false;
      await this.writeCache(next);
      return next;
    } catch (error) {
      this.refreshFailed = true;
      console.warn("GPU benchmark refresh failed; keeping the last valid snapshot:", error instanceof Error ? error.message : "unknown error");
      return this.snapshot;
    }
  }

  private async writeCache(snapshot: GpuRankingSnapshot) {
    const cacheFile = this.options.cacheFile;
    const temporaryFile = `${cacheFile}.${process.pid}.tmp`;
    try {
      await mkdir(path.dirname(cacheFile), { recursive: true });
      await writeFile(temporaryFile, JSON.stringify(snapshot), { encoding: "utf8", mode: 0o600 });
      await rename(temporaryFile, cacheFile);
    } catch (error) {
      console.warn("GPU benchmark snapshot could not be persisted:", error instanceof Error ? error.message : "unknown error");
    }
  }
}
