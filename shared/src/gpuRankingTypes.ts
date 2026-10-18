export type GpuScoreBenchmark = "timeSpyGraphics" | "portRoyal" | "geekbenchVulkan" | "geekbenchOpencl" | "geekbenchCuda";

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
