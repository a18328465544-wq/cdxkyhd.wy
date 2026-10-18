export type GpuScoreBenchmark =
  | "timeSpyGraphics"
  | "portRoyal"
  | "steelNomad"
  | "speedWay"
  | "geekbenchVulkan"
  | "geekbenchOpencl"
  | "geekbenchCuda";

export interface GpuGameMetric {
  relativeScore: number;
  fps: number;
}
export type GpuGameMetrics = readonly [
  GpuGameMetric | null,
  GpuGameMetric | null,
  GpuGameMetric | null,
];
export interface GpuGameModel {
  model: string;
  raster: GpuGameMetrics;
  rayTracing: GpuGameMetrics;
}
export interface GpuGameSnapshot {
  source: string;
  sourceUpdatedAt: string | null;
  checkedAt: string;
  updatedAt: string;
  models: GpuGameModel[];
}

export interface GpuRankingScoreModel {
  model: string;
  benchmark: GpuScoreBenchmark;
  score: number;
  samples: number;
}

export interface GpuRankingScoreSnapshot {
  source: string;
  version: string;
  sourceUpdatedAt: string | null;
  checkedAt: string;
  updatedAt: string;
  models: GpuRankingScoreModel[];
}
