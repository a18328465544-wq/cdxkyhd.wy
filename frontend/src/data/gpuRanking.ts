import type { GpuRankingScoreModel, GpuRankingScoreSnapshot, GpuScoreBenchmark } from "@cdxkyhd/shared";

export type GpuBrand = "NVIDIA" | "AMD" | "Intel";
export type GpuTestMode = "raster" | "rayTracing";
export type GpuRankingMode = GpuTestMode | "blenderCycles" | "timeSpyGraphics" | "portRoyal" | "geekbenchVulkan" | "geekbenchOpencl" | "geekbenchCuda";
export type GpuResolution = "1080p" | "1440p" | "4k";
export type { GpuRankingScoreModel, GpuRankingScoreSnapshot, GpuScoreBenchmark } from "@cdxkyhd/shared";

export interface GpuBenchmarkMetric {
  relativeScore: number;
  fps: number;
}

export interface GpuRankingBenchmarkModel {
  model: string;
  raster: readonly [GpuBenchmarkMetric, GpuBenchmarkMetric, GpuBenchmarkMetric];
  rayTracing: readonly [GpuBenchmarkMetric, GpuBenchmarkMetric, GpuBenchmarkMetric];
}

export interface GpuRankingSnapshot {
  source: string;
  sourceUpdatedAt: string | null;
  checkedAt: string;
  updatedAt: string;
  models: GpuRankingBenchmarkModel[];
}

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

export interface GpuRankingEntry {
  model: string;
  brand: GpuBrand;
  raster: readonly [number, number, number];
  rayTracing: readonly [number, number, number];
}

export function resolveGpuBenchmark(
  entry: GpuRankingEntry,
  synced: GpuRankingBenchmarkModel | undefined,
  mode: GpuTestMode,
  resolution: GpuResolution,
) {
  const index = resolution === "1080p" ? 0 : resolution === "1440p" ? 1 : 2;
  const metric = synced?.[mode][index];
  return {
    relativeScore: metric?.relativeScore ?? entry[mode][index],
    fps: metric?.fps ?? null,
  };
}

export function resolveBlenderGpuBenchmark(
  entry: GpuRankingEntry,
  models: readonly BlenderGpuRankingModel[],
) {
  const expected = gpuIdentity(entry.model);
  if (!expected) return { score: null, samples: null };

  const match = models
    .filter(model => {
      const actual = gpuIdentity(model.model);
      if (!actual || actual.base !== expected.base) return false;
      if (expected.memoryGb === undefined && actual.memoryGb !== undefined) return false;
      return expected.memoryGb === undefined || actual.memoryGb === undefined || expected.memoryGb === actual.memoryGb;
    })
    .sort((left, right) => {
      const leftExactMemory = Number(gpuIdentity(left.model)?.memoryGb === expected.memoryGb);
      const rightExactMemory = Number(gpuIdentity(right.model)?.memoryGb === expected.memoryGb);
      return rightExactMemory - leftExactMemory || right.samples - left.samples;
    })[0];
  return match
    ? { score: match.medianScore, samples: match.samples }
    : { score: null, samples: null };
}

export function resolveGpuRankingScore(
  entry: GpuRankingEntry,
  models: readonly GpuRankingScoreModel[],
  benchmark: GpuScoreBenchmark,
) {
  const expected = gpuIdentity(entry.model);
  if (!expected) return { score: null, samples: null };

  const match = models
    .filter(model => {
      if (model.benchmark !== benchmark) return false;
      const actual = gpuIdentity(model.model);
      if (!actual || actual.base !== expected.base) return false;
      if (expected.memoryGb === undefined && actual.memoryGb !== undefined) return false;
      return expected.memoryGb === undefined || actual.memoryGb === expected.memoryGb;
    })
    .sort((left, right) => right.samples - left.samples)[0];

  return match ? { score: match.score, samples: match.samples } : { score: null, samples: null };
}

// Relative native-resolution gaming scores from the cited June 2026 test suite.
// Each value is normalized to the RTX 5090's 1080p raster score (100).
export const GPU_RANKING_DATA: readonly GpuRankingEntry[] = [
  { model: "GeForce RTX 5090", brand: "NVIDIA", raster: [100, 100, 100], rayTracing: [100, 100, 100] },
  { model: "GeForce RTX 4090", brand: "NVIDIA", raster: [90.1, 85.7, 80.4], rayTracing: [89.4, 87, 81.4] },
  { model: "GeForce RTX 5080", brand: "NVIDIA", raster: [81.9, 76.7, 69.8], rayTracing: [78.2, 73.4, 65.7] },
  { model: "Radeon RX 7900 XTX", brand: "AMD", raster: [79.3, 73.1, 63.7], rayTracing: [56, 50.1, 42.6] },
  { model: "GeForce RTX 4080 Super", brand: "NVIDIA", raster: [78, 70.9, 62.6], rayTracing: [75, 68.9, 60.1] },
  { model: "GeForce RTX 4080", brand: "NVIDIA", raster: [77.2, 70.3, 60.9], rayTracing: [73.9, 67.8, 58.3] },
  { model: "GeForce RTX 5070 Ti", brand: "NVIDIA", raster: [76.2, 69.8, 61.9], rayTracing: [71.9, 65.7, 57.3] },
  { model: "Radeon RX 9070 XT", brand: "AMD", raster: [76.9, 69.7, 59.4], rayTracing: [61.9, 55.1, 47] },
  { model: "Radeon RX 7900 XT", brand: "AMD", raster: [71.3, 64.6, 54], rayTracing: [49.1, 43.1, 36] },
  { model: "GeForce RTX 4070 Ti Super", brand: "NVIDIA", raster: [69.3, 62.1, 52.8], rayTracing: [69.9, 59.5, 50.2] },
  { model: "Radeon RX 9070", brand: "AMD", raster: [69.1, 62.1, 52.1], rayTracing: [53.8, 47.2, 40.2] },
  { model: "GeForce RTX 3090 Ti", brand: "NVIDIA", raster: [64.7, 59.7, 53.5], rayTracing: [57.5, 51.8, 45.8] },
  { model: "GeForce RTX 4070 Ti", brand: "NVIDIA", raster: [66.3, 58.6, 48.6], rayTracing: [62.4, 54.8, 37.2] },
  { model: "GeForce RTX 5070", brand: "NVIDIA", raster: [65.1, 57.6, 49], rayTracing: [58.9, 51.1, 35.4] },
  { model: "GeForce RTX 3090", brand: "NVIDIA", raster: [60.3, 54.7, 47.9], rayTracing: [52.9, 47, 41] },
  { model: "GeForce RTX 4070 Super", brand: "NVIDIA", raster: [62.2, 54.5, 44.4], rayTracing: [57.7, 43.2, 34.4] },
  { model: "Radeon RX 6950 XT", brand: "AMD", raster: [60.5, 53.5, 43.6], rayTracing: [37.3, 32.6, 24.3] },
  { model: "GeForce RTX 3080 Ti", brand: "NVIDIA", raster: [58.7, 53.3, 46], rayTracing: [51.4, 45.8, 28.1] },
  { model: "Radeon RX 9070 GRE", brand: "AMD", raster: [59.2, 51.8, 41.8], rayTracing: [46.5, 37, 24.2] },
  { model: "Radeon RX 7800 XT", brand: "AMD", raster: [58.1, 50.7, 40.7], rayTracing: [38.5, 33.3, 23.5] },
  { model: "Radeon RX 6900 XT", brand: "AMD", raster: [57.4, 50.2, 40.5], rayTracing: [36, 31.8, 23.6] },
  { model: "GeForce RTX 3080", brand: "NVIDIA", raster: [54.8, 49, 39.6], rayTracing: [40.8, 34.4, 21.5] },
  { model: "Radeon RX 6800 XT", brand: "AMD", raster: [54.9, 47.6, 38.1], rayTracing: [33.4, 29.4, 21.9] },
  { model: "GeForce RTX 4070", brand: "NVIDIA", raster: [54.7, 46.5, 37.2], rayTracing: [50.7, 38.3, 30.1] },
  { model: "GeForce RTX 5060 Ti 16GB", brand: "NVIDIA", raster: [51.6, 43.9, 36.3], rayTracing: [44.7, 38.6, 32.1] },
  { model: "Radeon RX 7700 XT", brand: "AMD", raster: [50.5, 43.4, 34.3], rayTracing: [33.1, 25.1, 15.2] },
  { model: "Radeon RX 9060 XT 16GB", brand: "AMD", raster: [48.2, 40.2, 31.7], rayTracing: [36, 30.8, 23.3] },
  { model: "GeForce RTX 5060 Ti 8GB", brand: "NVIDIA", raster: [49.3, 41, 25.4], rayTracing: [36.6, 26.3, 11.3] },
  { model: "GeForce RTX 3070 Ti", brand: "NVIDIA", raster: [46.4, 40, 23.5], rayTracing: [33.5, 27.5, 13.7] },
  { model: "Radeon RX 9060 XT 8GB", brand: "AMD", raster: [45.7, 37.3, 26.8], rayTracing: [26.3, 20.1, 11.4] },
  { model: "GeForce RTX 4060 Ti 16GB", brand: "NVIDIA", raster: [43.8, 36.2, 28.2], rayTracing: [38.4, 32.5, 26.3] },
  { model: "Radeon RX 7600 XT", brand: "AMD", raster: [50.1, 30, 23.1], rayTracing: [21.4, 18, 13.2] },
  { model: "GeForce RTX 3070", brand: "NVIDIA", raster: [42.8, 34.8, 23.6], rayTracing: [31.6, 26, 12.9] },
  { model: "GeForce RTX 4060 Ti 8GB", brand: "NVIDIA", raster: [43.2, 35.2, 21.5], rayTracing: [32.5, 25.5, 12.6] },
  { model: "Radeon RX 6750 XT", brand: "AMD", raster: [40.8, 34.4, 26.7], rayTracing: [22.6, 18.9, 12.7] },
  { model: "GeForce RTX 5060", brand: "NVIDIA", raster: [43.4, 35.8, 19.6], rayTracing: [32.6, 24.4, 10.7] },
  { model: "Radeon RX 6700 XT", brand: "AMD", raster: [38.9, 32.5, 25.3], rayTracing: [21.6, 17.9, 12.3] },
  { model: "Intel Arc B580", brand: "Intel", raster: [35.1, 30.3, 24.9], rayTracing: [27.7, 22.9, 5.9] },
  { model: "GeForce RTX 3060 Ti", brand: "NVIDIA", raster: [36.4, 30.5, 17.5], rayTracing: [26.4, 22.2, 11.5] },
  { model: "GeForce RTX 4060", brand: "NVIDIA", raster: [35.1, 28.4, 15.7], rayTracing: [26.7, 21.1, 10.6] },
  { model: "Radeon RX 7600", brand: "AMD", raster: [34.3, 27.2, 16.6], rayTracing: [12.7, 9.3, 6.5] },
  { model: "GeForce RTX 5050", brand: "NVIDIA", raster: [34, 27.1, 15.4], rayTracing: [24.9, 18.5, 9.6] },
  { model: "Intel Arc B570", brand: "Intel", raster: [31.1, 26.5, 17.7], rayTracing: [15.7, 12.9, 5.1] },
  { model: "GeForce RTX 3060 12GB", brand: "NVIDIA", raster: [30.2, 25, 20], rayTracing: [24.2, 20.6, 14.8] },
  { model: "Radeon RX 6650 XT", brand: "AMD", raster: [31.5, 22.7, 17.1], rayTracing: [12.4, 9.1, 5.3] },
  { model: "Radeon RX 6600 XT", brand: "AMD", raster: [30.8, 24.3, 15.6], rayTracing: [13.7, 9, 5.4] },
  { model: "Radeon RX 6600", brand: "AMD", raster: [25.5, 14.9, 13.1], rayTracing: [10.2, 7.6, 4.8] },
  { model: "GeForce RTX 3050", brand: "NVIDIA", raster: [21.9, 17.8, 11.4], rayTracing: [15.6, 12.5, 7.1] },
];

export function gpuIdentity(name: string): { base: string; memoryGb?: number } | null {
  const normalized = name.toUpperCase().replace(/\s+/g, " ").trim();
  const mobileVariant = /\b(?:LAPTOP|MOBILE|MAX[ -]?Q)\b/.test(normalized);
  const rtx = normalized.match(/RTX\s*(\d{4})\s*(TI\s*SUPER|TI|SUPER|D)?/);
  const rx = normalized.match(/RX\s*(\d{4})\s*(XTX|GRE|XT)?/);
  const arc = normalized.match(/ARC\s*(B\s*\d{3})/);
  const match = rtx ?? rx ?? arc;
  if (!match) return null;

  const base = rtx
    ? `RTX${rtx[1]}${(rtx[2] ?? "").replace(/\s/g, "")}`
    : rx
      ? `RX${rx[1]}${rx[2] ?? ""}`
      : `ARC${arc![1].replace(/\s/g, "")}`;
  const memory = normalized.match(/\b(8|12|16|24|32)\s*(?:GB|G)\b/);
  return { base: `${base}${mobileVariant ? "MOBILE" : ""}`, memoryGb: memory ? Number(memory[1]) : undefined };
}

export function gpuInventoryMatchKey(model: string): string | null {
  const identity = gpuIdentity(model);
  return identity ? `${identity.base}${identity.memoryGb ? `${identity.memoryGb}GB` : ""}` : null;
}

export function gpuInventoryMatches(benchmarkModel: string, inventoryModel: string): boolean {
  const expected = gpuIdentity(benchmarkModel);
  const actual = gpuIdentity(inventoryModel);
  if (!expected || !actual || expected.base !== actual.base) return false;
  return expected.memoryGb === undefined || expected.memoryGb === actual.memoryGb;
}

export function isGpuInventoryAvailable(item: { quantity: number; status: string }): boolean {
  return item.quantity > 0 && (item.status === "已入库" || item.status === "已上架");
}
