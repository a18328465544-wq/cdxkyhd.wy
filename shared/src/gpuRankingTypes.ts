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
  samples: number | null;
}

export interface GpuRankingBenchmarkSource {
  source: string;
  name: string;
  methodology: "review" | "public-median" | "community-rating";
  sourceUpdatedAt: string | null;
  checkedAt: string;
  updatedAt: string;
  refreshFailed: boolean;
  reason?: string;
}

export interface GpuRankingScoreSnapshot {
  source: string;
  version: string;
  sourceUpdatedAt: string | null;
  checkedAt: string;
  updatedAt: string;
  models: GpuRankingScoreModel[];
  sources?: Partial<Record<GpuScoreBenchmark, GpuRankingBenchmarkSource>>;
}
