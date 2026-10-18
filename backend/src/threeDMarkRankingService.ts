import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GpuRankingScoreModel, GpuRankingScoreSnapshot } from "@cdxkyhd/shared";

export const THREE_DMARK_RANKING_SOURCE = "https://www.3dmark.com/search";
export const THREE_DMARK_RANKING_VERSION = "Time Spy Graphics + Port Royal + Steel Nomad + Speed Way";
const LEGACY_VERSION = "Time Spy Graphics + Port Royal";
export const THREE_DMARK_RANKING_REFRESH_INTERVAL_MS = 15 * 60 * 1000;

interface ThreeDMarkRankingServiceOptions {
  cacheFile: string;
  dataFile?: string;
  redistributionAllowed?: boolean;
}

interface ThreeDMarkDataFile {
  schemaVersion: number;
  sourceUrl: string;
  sourceUpdatedAt: string;
  filtering: string;
  models: Array<{
    model: string;
    timeSpyGraphicsScores?: number[];
    portRoyalScores?: number[];
    steelNomadScores?: number[];
    speedWayScores?: number[];
  }>;
}

const MAXIMUM_JSON_BYTES = 20_000_000;
const MAXIMUM_RESULTS_PER_MODEL = 50_000;
const ALLOWED_BENCHMARKS = new Set(["timeSpyGraphics", "portRoyal", "steelNomad", "speedWay"]);

function median(values: number[]) {
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}

function validateScores(values: unknown): values is number[] {
  return Array.isArray(values) && values.length <= MAXIMUM_RESULTS_PER_MODEL && values.every(value => Number.isFinite(value) && value > 0 && value <= 10_000_000);
}

function validateSnapshotModels(value: unknown): value is GpuRankingScoreModel[] {
  if (!Array.isArray(value)) return false;
  const keys = new Set<string>();
  return value.every((entry: unknown) => {
    if (!entry || typeof entry !== "object") return false;
    const model = entry as GpuRankingScoreModel;
    const key = `${model.model}:${model.benchmark}`;
    if (
      typeof model.model !== "string" ||
      !model.model.trim() ||
      !ALLOWED_BENCHMARKS.has(model.benchmark) ||
      keys.has(key) ||
      !Number.isFinite(model.score) ||
      model.score <= 0 ||
      model.score > 10_000_000 ||
      typeof model.samples !== "number" ||
      !Number.isInteger(model.samples) ||
      model.samples < 1 ||
      model.samples > MAXIMUM_RESULTS_PER_MODEL
    ) return false;
    keys.add(key);
    return true;
  });
}

export function parseThreeDMarkRankingJson(json: string): GpuRankingScoreModel[] {
  if (Buffer.byteLength(json, "utf8") > MAXIMUM_JSON_BYTES) throw new Error("3DMark data file exceeded the size limit");
  const payload = JSON.parse(json) as ThreeDMarkDataFile;
  if (
    payload.schemaVersion !== 1 ||
    typeof payload.sourceUrl !== "string" ||
    !payload.sourceUrl.startsWith("https://www.3dmark.com/") ||
    typeof payload.sourceUpdatedAt !== "string" ||
    !Number.isFinite(Date.parse(payload.sourceUpdatedAt)) ||
    payload.filtering !== "valid-stock-only" ||
    !Array.isArray(payload.models)
  ) {
    throw new Error("3DMark data must identify its official source, update time, and valid stock-only filtering");
  }

  const seen = new Set<string>();
  const models: GpuRankingScoreModel[] = [];
  for (const row of payload.models) {
    if (!row.model || seen.has(row.model)) throw new Error("3DMark data contains duplicate or empty GPU models");
    seen.add(row.model);
    for (const [field, benchmark] of [["timeSpyGraphicsScores", "timeSpyGraphics"], ["portRoyalScores", "portRoyal"], ["steelNomadScores", "steelNomad"], ["speedWayScores", "speedWay"]] as const) {
      const values = row[field] ?? [];
      if (!validateScores(values)) throw new Error(`3DMark ${field} contains invalid score values`);
      if (values.length) models.push({ model: row.model, benchmark, score: median(values), samples: values.length });
    }
  }
  if (models.length === 0) throw new Error("3DMark data file contains no benchmark scores");
  return models;
}

export class ThreeDMarkRankingService {
  private snapshot: GpuRankingScoreSnapshot | null = null;
  private refreshInFlight: Promise<GpuRankingScoreSnapshot | null> | null = null;
  private lastRefreshFailed = false;

  constructor(private readonly options: ThreeDMarkRankingServiceOptions) {}

  static async open(options: ThreeDMarkRankingServiceOptions) {
    const service = new ThreeDMarkRankingService(options);
    if (options.redistributionAllowed && options.dataFile) {
      await service.readCache();
      await service.refresh();
    }
    return service;
  }

  getSnapshot() {
    return this.snapshot;
  }

  getStatus() {
    if (!this.options.redistributionAllowed) return { configured: false, reason: "尚未确认 3DMark 成绩展示授权" };
    if (!this.options.dataFile) return { configured: false, reason: "等待配置授权成绩数据文件" };
    return { configured: true, refreshFailed: this.lastRefreshFailed, reason: this.lastRefreshFailed ? "成绩文件无效或暂不可用，保留上次有效数据" : this.snapshot ? "已同步" : "等待授权成绩文件" };
  }

  refresh(): Promise<GpuRankingScoreSnapshot | null> {
    if (!this.options.redistributionAllowed || !this.options.dataFile) return Promise.resolve(this.snapshot);
    if (this.refreshInFlight) return this.refreshInFlight;
    this.refreshInFlight = this.readAndStore().finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
  }

  private async readCache() {
    try {
      const parsed = JSON.parse(await readFile(this.options.cacheFile, "utf8")) as GpuRankingScoreSnapshot;
      if (
        parsed.source !== THREE_DMARK_RANKING_SOURCE ||
        (parsed.version !== THREE_DMARK_RANKING_VERSION && parsed.version !== LEGACY_VERSION) ||
        typeof parsed.sourceUpdatedAt !== "string" ||
        !Number.isFinite(Date.parse(parsed.sourceUpdatedAt)) ||
        !Number.isFinite(Date.parse(parsed.checkedAt)) ||
        !Number.isFinite(Date.parse(parsed.updatedAt)) ||
        !validateSnapshotModels(parsed.models)
      ) return;
      this.snapshot = parsed;
    } catch {
      this.snapshot = null;
    }
  }

  private async readAndStore(): Promise<GpuRankingScoreSnapshot | null> {
    try {
      const json = await readFile(this.options.dataFile!, "utf8");
      const models = parseThreeDMarkRankingJson(json);
      const payload = JSON.parse(json) as ThreeDMarkDataFile;
      const now = new Date().toISOString();
      const changed = !this.snapshot || JSON.stringify(this.snapshot.models) !== JSON.stringify(models) || this.snapshot.sourceUpdatedAt !== payload.sourceUpdatedAt;
      const next: GpuRankingScoreSnapshot = {
        source: THREE_DMARK_RANKING_SOURCE,
        version: THREE_DMARK_RANKING_VERSION,
        sourceUpdatedAt: payload.sourceUpdatedAt,
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
      console.warn("3DMark GPU ranking import failed; keeping the last valid snapshot:", error instanceof Error ? error.message : "unknown error");
      return this.snapshot;
    }
  }

  private async writeCache(snapshot: GpuRankingScoreSnapshot) {
    const temporaryFile = `${this.options.cacheFile}.${process.pid}.tmp`;
    try {
      await mkdir(path.dirname(this.options.cacheFile), { recursive: true });
      await writeFile(temporaryFile, JSON.stringify(snapshot), { encoding: "utf8", mode: 0o600 });
      await rename(temporaryFile, this.options.cacheFile);
    } catch (error) {
      console.warn("3DMark GPU ranking snapshot could not be persisted:", error instanceof Error ? error.message : "unknown error");
    }
  }
}
