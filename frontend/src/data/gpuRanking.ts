import {
  buildGpuCatalog,
  gpuIdentity,
  gpuModelKey,
  type GpuCatalogEntry,
  type GpuGameModel,
  type GpuGameSnapshot,
  type GpuRankingScoreModel,
  type GpuScoreBenchmark,
} from "@cdxkyhd/shared";

export { buildGpuCatalog, gpuIdentity, gpuModelKey };
export type {
  GpuCatalogEntry,
  GpuRankingScoreModel,
  GpuRankingScoreSnapshot,
  GpuScoreBenchmark,
} from "@cdxkyhd/shared";
export type GpuBrand = "NVIDIA" | "AMD" | "Intel";
export type GpuTestMode = "raster" | "rayTracing";
export type GpuRankingMode = GpuTestMode | "blenderCycles" | GpuScoreBenchmark;
export type GpuResolution = "1080p" | "1440p" | "4k";
export type GpuRankingEntry = GpuCatalogEntry;
export type GpuRankingBenchmarkModel = GpuGameModel;
export type GpuRankingSnapshot = GpuGameSnapshot;
export interface BlenderGpuRankingModel {
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
  models: BlenderGpuRankingModel[];
}

export const GPU_RANKING_DATA = buildGpuCatalog();

function sameBenchmarkModel(expected: string, actual: string) {
  const left = gpuModelKey(expected);
  return left !== null && left === gpuModelKey(actual);
}

export function findGameBenchmark(
  entry: GpuRankingEntry,
  snapshot: GpuRankingSnapshot | null,
) {
  return snapshot?.models.find((model) =>
    sameBenchmarkModel(entry.model, model.model),
  );
}

export function resolveGpuBenchmark(
  _entry: GpuRankingEntry,
  synced: GpuRankingBenchmarkModel | undefined,
  mode: GpuTestMode,
  resolution: GpuResolution,
) {
  const metric =
    synced?.[mode][resolution === "1080p" ? 0 : resolution === "1440p" ? 1 : 2];
  return {
    relativeScore: metric?.relativeScore ?? null,
    fps: metric?.fps ?? null,
  };
}

export function resolveBlenderGpuBenchmark(
  entry: GpuRankingEntry,
  models: readonly BlenderGpuRankingModel[],
) {
  const match = models
    .filter((model) => sameBenchmarkModel(entry.model, model.model))
    .sort((a, b) => b.samples - a.samples)[0];
  return match
    ? { score: match.medianScore, samples: match.samples }
    : { score: null, samples: null };
}

export function resolveGpuRankingScore(
  entry: GpuRankingEntry,
  models: readonly GpuRankingScoreModel[],
  benchmark: GpuScoreBenchmark,
) {
  const match = models
    .filter(
      (model) =>
        model.benchmark === benchmark &&
        sameBenchmarkModel(entry.model, model.model),
    )
    .sort((a, b) => b.samples - a.samples)[0];
  return match
    ? { score: match.score, samples: match.samples }
    : { score: null, samples: null };
}

export function gpuInventoryMatchKey(model: string) {
  return gpuModelKey(model);
}

export function gpuInventoryMatches(
  benchmarkModel: string,
  inventoryModel: string,
): boolean {
  const expected = gpuIdentity(benchmarkModel);
  const actual = gpuIdentity(inventoryModel);
  if (!expected || !actual || expected.base !== actual.base) return false;
  return (
    expected.memoryGb === undefined || expected.memoryGb === actual.memoryGb
  );
}

export function isGpuInventoryAvailable(item: {
  quantity: number;
  status: string;
}) {
  return (
    item.quantity > 0 && (item.status === "已入库" || item.status === "已上架")
  );
}

export function relativePerformance(
  value: number | null,
  baseline: number | null,
): number | null {
  return value !== null &&
    baseline !== null &&
    Number.isFinite(value) &&
    Number.isFinite(baseline) &&
    value > 0 &&
    baseline > 0
    ? (value / baseline) * 100
    : null;
}
