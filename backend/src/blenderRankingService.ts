import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export const BLENDER_RANKING_SOURCE = "https://opendata.blender.org/benchmarks/query/";
export const BLENDER_RANKING_VERSION = "5.2.0";
export const BLENDER_RANKING_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

export interface BlenderGpuBenchmarkModel {
  model: string;
  medianScore: number;
  samples: number;
}

export interface BlenderGpuRankingSnapshot {
  source: string;
  version: string;
  sourceUpdatedAt: string | null;
  checkedAt: string;
  updatedAt: string;
  models: BlenderGpuBenchmarkModel[];
}

interface BlenderRankingServiceOptions {
  cacheFile: string;
  fetcher?: typeof fetch;
}

interface BlenderDatatableResponse {
  columns: Array<{ display_name?: string }>;
  rows: unknown[][];
}

const MINIMUM_MODEL_COUNT = 100;
const MAXIMUM_JSON_BYTES = 2_000_000;
const FETCH_TIMEOUT_MS = 20_000;
const COMPUTE_TYPES = ["OPTIX", "CUDA", "HIP", "METAL", "ONEAPI"];

function validateModels(models: BlenderGpuBenchmarkModel[]) {
  if (models.length < MINIMUM_MODEL_COUNT) throw new Error("Blender benchmark source returned too few devices");
  const names = new Set<string>();
  for (const model of models) {
    if (!model.model || names.has(model.model)) throw new Error("Blender benchmark source contains duplicate devices");
    names.add(model.model);
    if (!Number.isFinite(model.medianScore) || model.medianScore <= 0 || model.medianScore > 1_000_000) {
      throw new Error("Blender benchmark source contains an invalid score");
    }
    if (!Number.isInteger(model.samples) || model.samples < 1 || model.samples > 1_000_000) {
      throw new Error("Blender benchmark source contains an invalid sample count");
    }
  }
}

export function buildBlenderRankingUrl() {
  const url = new URL(BLENDER_RANKING_SOURCE);
  for (const type of COMPUTE_TYPES) url.searchParams.append("compute_type", type);
  url.searchParams.set("blender_version", BLENDER_RANKING_VERSION);
  url.searchParams.set("group_by", "device_name");
  url.searchParams.set("response_type", "datatables");
  return url;
}

export function parseBlenderRankingJson(json: string): BlenderGpuBenchmarkModel[] {
  const payload = JSON.parse(json) as BlenderDatatableResponse;
  const headers = payload.columns?.map(column => column.display_name);
  if (
    !headers ||
    headers[0] !== "Device Name" ||
    headers[1] !== "Median Score" ||
    headers[2] !== "Number of Benchmarks" ||
    !Array.isArray(payload.rows)
  ) {
    throw new Error("Blender benchmark response format changed");
  }

  const models = payload.rows.map(row => {
    const [model, medianScore, samples] = row;
    return {
      model: typeof model === "string" ? model.trim() : "",
      medianScore: Number(medianScore),
      samples: Number(samples),
    };
  });
  validateModels(models);
  return models;
}

export class BlenderGpuRankingService {
  private snapshot: BlenderGpuRankingSnapshot | null = null;
  private refreshInFlight: Promise<BlenderGpuRankingSnapshot | null> | null = null;
  private readonly fetcher: typeof fetch;

  constructor(private readonly options: BlenderRankingServiceOptions) {
    this.fetcher = options.fetcher ?? fetch;
  }

  static async open(options: BlenderRankingServiceOptions) {
    const service = new BlenderGpuRankingService(options);
    await service.readCache();
    return service;
  }

  getSnapshot() {
    return this.snapshot;
  }

  refresh(): Promise<BlenderGpuRankingSnapshot | null> {
    if (this.refreshInFlight) return this.refreshInFlight;
    this.refreshInFlight = this.fetchAndStore().finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
  }

  private async readCache() {
    try {
      const parsed = JSON.parse(await readFile(this.options.cacheFile, "utf8")) as BlenderGpuRankingSnapshot;
      if (
        parsed.source !== BLENDER_RANKING_SOURCE ||
        parsed.version !== BLENDER_RANKING_VERSION ||
        !Number.isFinite(Date.parse(parsed.checkedAt)) ||
        !Number.isFinite(Date.parse(parsed.updatedAt))
      ) return;
      validateModels(parsed.models);
      this.snapshot = parsed;
    } catch {
      this.snapshot = null;
    }
  }

  private async fetchAndStore(): Promise<BlenderGpuRankingSnapshot | null> {
    try {
      const response = await this.fetcher(buildBlenderRankingUrl(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "ChengduGPUWebsite/1.0 (Blender Open Data sync)",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`Blender benchmark source returned HTTP ${response.status}`);
      const contentLength = Number(response.headers.get("content-length"));
      if (Number.isFinite(contentLength) && contentLength > MAXIMUM_JSON_BYTES) throw new Error("Blender benchmark response exceeded the size limit");
      const json = await response.text();
      if (Buffer.byteLength(json, "utf8") > MAXIMUM_JSON_BYTES) throw new Error("Blender benchmark response exceeded the size limit");

      const models = parseBlenderRankingJson(json);
      const now = new Date().toISOString();
      const changed = !this.snapshot || JSON.stringify(this.snapshot.models) !== JSON.stringify(models);
      const next: BlenderGpuRankingSnapshot = {
        source: BLENDER_RANKING_SOURCE,
        version: BLENDER_RANKING_VERSION,
        sourceUpdatedAt: null,
        checkedAt: now,
        updatedAt: changed ? now : this.snapshot!.updatedAt,
        models,
      };
      this.snapshot = next;
      await this.writeCache(next);
      return next;
    } catch (error) {
      console.warn("Blender benchmark refresh failed; keeping the last valid snapshot:", error instanceof Error ? error.message : "unknown error");
      return this.snapshot;
    }
  }

  private async writeCache(snapshot: BlenderGpuRankingSnapshot) {
    const cacheFile = this.options.cacheFile;
    const temporaryFile = `${cacheFile}.${process.pid}.tmp`;
    try {
      await mkdir(path.dirname(cacheFile), { recursive: true });
      await writeFile(temporaryFile, JSON.stringify(snapshot), { encoding: "utf8", mode: 0o600 });
      await rename(temporaryFile, cacheFile);
    } catch (error) {
      console.warn("Blender benchmark snapshot could not be persisted:", error instanceof Error ? error.message : "unknown error");
    }
  }
}
