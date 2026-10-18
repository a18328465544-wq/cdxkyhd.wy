import type { GpuRankingMode, GpuResolution } from "./gpuRanking";

export const RANKING_MODES: {
  value: GpuRankingMode;
  label: string;
  family: string;
}[] = [
  { value: "raster", label: "光栅游戏", family: "gaming" },
  { value: "rayTracing", label: "光线追踪", family: "gaming" },
  { value: "timeSpyGraphics", label: "Time Spy 显卡分", family: "threeDMark" },
  { value: "portRoyal", label: "Port Royal 光追分", family: "threeDMark" },
  { value: "steelNomad", label: "Steel Nomad", family: "threeDMark" },
  { value: "speedWay", label: "Speed Way", family: "threeDMark" },
  { value: "blenderCycles", label: "Blender Cycles", family: "compute" },
  { value: "geekbenchVulkan", label: "Geekbench Vulkan", family: "compute" },
  { value: "geekbenchOpencl", label: "Geekbench OpenCL", family: "compute" },
  { value: "geekbenchCuda", label: "Geekbench CUDA", family: "compute" },
];

export function parseRankingQuery(search: string) {
  const query = new URLSearchParams(search);
  const mode =
    RANKING_MODES.find((item) => item.value === query.get("test"))?.value ??
    "raster";
  const resolution: GpuResolution =
    query.get("res") === "1080p"
      ? "1080p"
      : query.get("res") === "4k"
        ? "4k"
        : "1440p";
  const selected = [
    ...new Set(
      (query.get("compare") ?? "")
        .split(",")
        .filter((id) => /^[A-Z0-9-]{2,64}$/.test(id)),
    ),
  ].slice(0, 4);
  const baseline = selected.includes(query.get("base") ?? "")
    ? query.get("base")!
    : (selected[0] ?? "");
  return { mode, resolution, selected, baseline };
}

export function rankingQuery(state: ReturnType<typeof parseRankingQuery>) {
  const query = new URLSearchParams();
  query.set("test", state.mode);
  query.set("res", state.resolution);
  if (state.selected.length) {
    query.set("compare", state.selected.join(","));
    query.set(
      "base",
      state.selected.includes(state.baseline)
        ? state.baseline
        : state.selected[0],
    );
  }
  return `?${query}`;
}
