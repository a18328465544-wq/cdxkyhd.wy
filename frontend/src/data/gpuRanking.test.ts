import {
  buildGpuCatalog,
  GPU_RANKING_DATA,
  gpuIdentity,
  gpuInventoryMatches,
  isGpuInventoryAvailable,
  relativePerformance,
  resolveBlenderGpuBenchmark,
  resolveGpuBenchmark,
  resolveGpuRankingScore,
} from "./gpuRanking";
import { parseRankingQuery, rankingQuery } from "./gpuRankingQuery";
import { GPU_RANKING_MODEL_NAMES } from "../../../shared/src/gpuRankingModels.ts";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(
  GPU_RANKING_DATA.length > 110,
  "catalog includes older, professional, and D variants beyond the original 48 GPUs",
);
assert(
  GPU_RANKING_MODEL_NAMES.every((name) =>
    GPU_RANKING_DATA.some((entry) => entry.model === name),
  ),
  "original catalog models remain discoverable",
);
assert(
  new Set(GPU_RANKING_DATA.map((entry) => entry.id)).size ===
    GPU_RANKING_DATA.length,
  "catalog IDs are unique",
);
assert(
  GPU_RANKING_DATA.every((entry) => !("raster" in entry)),
  "catalog does not invent benchmark scores",
);

const fallbackBenchmark = resolveGpuBenchmark(
  GPU_RANKING_DATA[0],
  undefined,
  "raster",
  "1440p",
);
assert(
  fallbackBenchmark.relativeScore === null && fallbackBenchmark.fps === null,
  "missing source data does not fall back to stale hardcoded scores",
);
const syncedBenchmark = resolveGpuBenchmark(
  GPU_RANKING_DATA[0],
  {
    model: GPU_RANKING_DATA[0].model,
    raster: [
      { relativeScore: 100, fps: 203.8 },
      { relativeScore: 100, fps: 167.3 },
      { relativeScore: 100, fps: 110.8 },
    ],
    rayTracing: [
      { relativeScore: 100, fps: 125.7 },
      { relativeScore: 100, fps: 100.8 },
      { relativeScore: 100, fps: 64.1 },
    ],
  },
  "rayTracing",
  "4k",
);
assert(
  syncedBenchmark.relativeScore === 100 && syncedBenchmark.fps === 64.1,
  "selected test mode and resolution use source FPS",
);

const blenderBenchmark = resolveBlenderGpuBenchmark(GPU_RANKING_DATA[0], [
  { model: "NVIDIA GeForce RTX 5090", medianScore: 16_094.6, samples: 158 },
  { model: "NVIDIA GeForce RTX 5090 D", medianScore: 17_418.9, samples: 2 },
]);
assert(
  blenderBenchmark.score === 16_094.6 && blenderBenchmark.samples === 158,
  "Blender scores preserve source median and sample count",
);
assert(
  resolveBlenderGpuBenchmark(GPU_RANKING_DATA[0], []).score === null,
  "missing Blender data is not fabricated",
);
assert(
  resolveBlenderGpuBenchmark(GPU_RANKING_DATA[0], [
    { model: "NVIDIA GeForce RTX 5090 D", medianScore: 17_418.9, samples: 2 },
  ]).score === null,
  "GPU variants do not inherit another card's score",
);
const externalScore = resolveGpuRankingScore(
  GPU_RANKING_DATA[0],
  [
    {
      model: "NVIDIA GeForce RTX 5090",
      benchmark: "geekbenchVulkan",
      score: 374_231,
      samples: 16,
    },
  ],
  "geekbenchVulkan",
);
assert(
  externalScore.score === 374_231 && externalScore.samples === 16,
  "external benchmark scores resolve by GPU model and test",
);
assert(
  resolveGpuRankingScore(
    GPU_RANKING_DATA[0],
    [
      {
        model: "NVIDIA GeForce RTX 5090 D",
        benchmark: "geekbenchVulkan",
        score: 374_326,
        samples: 16,
      },
    ],
    "geekbenchVulkan",
  ).score === null,
  "external GPU variants remain separate",
);
const gpu8Gb = GPU_RANKING_DATA.find(
  (entry) => entry.model === "GeForce RTX 5060 Ti 8GB",
)!;
assert(
  resolveGpuRankingScore(
    gpu8Gb,
    [
      {
        model: "NVIDIA GeForce RTX 5060 Ti 16GB",
        benchmark: "timeSpyGraphics",
        score: 20_000,
        samples: 12,
      },
    ],
    "timeSpyGraphics",
  ).score === null,
  "external VRAM-specific scores stay with the matching variant",
);
assert(
  gpuIdentity("NVIDIA GeForce RTX 5090 Laptop GPU")?.base === "RTX5090MOBILE",
  "mobile GPU scores remain separate from desktop cards",
);
const desktopPreferred = resolveBlenderGpuBenchmark(GPU_RANKING_DATA[0], [
  {
    model: "NVIDIA GeForce RTX 5090 Laptop GPU",
    medianScore: 8_071.6,
    samples: 500,
  },
  { model: "NVIDIA GeForce RTX 5090", medianScore: 16_094.6, samples: 158 },
]);
assert(
  desktopPreferred.score === 16_094.6,
  "desktop cards do not inherit higher-sample laptop results",
);
const gpu16Gb = GPU_RANKING_DATA.find(
  (entry) => entry.model === "GeForce RTX 5060 Ti 16GB",
)!;
assert(
  resolveBlenderGpuBenchmark(gpu16Gb, [
    {
      model: "NVIDIA GeForce RTX 5060 Ti 8GB",
      medianScore: 4_000,
      samples: 60,
    },
  ]).score === null,
  "VRAM-specific Blender data stays with the matching card variant",
);

assert(
  gpuInventoryMatches("GeForce RTX 4090", "影驰 RTX4090 24G OC"),
  "AIB suffixes and spacing should not block an exact GPU model match",
);
assert(
  !gpuInventoryMatches("GeForce RTX 5090", "RTX 5090D 32GB"),
  "a D variant must not inherit the base GPU's ranking or stock flag",
);
assert(
  gpuInventoryMatches("GeForce RTX 5060 Ti 16GB", "RTX5060Ti 16G"),
  "VRAM-specific variants should match when capacities agree",
);
assert(
  !gpuInventoryMatches("GeForce RTX 5060 Ti 16GB", "RTX 5060 Ti 8GB"),
  "different VRAM variants must not be conflated",
);
assert(
  !gpuInventoryMatches("Radeon RX 7900 XTX", "Radeon RX 7900 XT 20GB"),
  "XTX and XT models must remain distinct",
);
assert(
  gpuIdentity("Intel Arc B580")?.base === "ARCB580",
  "Intel model identity should normalize consistently",
);
assert(
  isGpuInventoryAvailable({ quantity: 1, status: "已入库" }),
  "received inventory should appear as in stock",
);
assert(
  isGpuInventoryAvailable({ quantity: 2, status: "已上架" }),
  "listed inventory should appear as in stock",
);
assert(
  !isGpuInventoryAvailable({ quantity: 0, status: "已入库" }),
  "zero quantity must not appear as in stock",
);
assert(
  !isGpuInventoryAvailable({ quantity: 1, status: "已出库" }),
  "shipped inventory must not appear as in stock",
);

assert(
  gpuInventoryMatches("GeForce RTX 4080 Super", "七彩虹 4080S RTX4080S 16G"),
  "S aliases resolve to Super",
);
assert(
  gpuInventoryMatches("GeForce RTX 4080 Super", "七彩虹 4080S 16G"),
  "ERP compact names may omit the RTX prefix",
);
assert(
  gpuInventoryMatches("GeForce RTX 5060 Ti 16GB", "索泰 5060TI 16G 金属大师"),
  "prefixed brand names retain the exact card and VRAM",
);
assert(
  gpuInventoryMatches("GeForce GTX 1660 Super", "影驰1660S 6G"),
  "short legacy GTX names resolve",
);
assert(
  gpuIdentity("锐龙 5600X CPU") === null &&
    gpuIdentity("Intel i5 12490F") === null,
  "CPU numbers never use permissive numeric GPU matching",
);
assert(
  gpuInventoryMatches("GeForce RTX 4070 Ti Super", "RTX4070TISUPER"),
  "Ti Super compact aliases resolve",
);
assert(
  gpuInventoryMatches("GeForce GTX 1660 Super", "GTX1660S 6G"),
  "old GTX aliases match",
);
assert(
  !gpuInventoryMatches("RTX A4000", "Quadro RTX 4000"),
  "professional generations are separate",
);
assert(
  !gpuInventoryMatches("GeForce RTX 5090 D", "GeForce RTX 5090 D V2"),
  "D V2 is separate from D",
);
assert(
  gpuIdentity("Intel Arc A770M")?.kind === "mobile",
  "Intel mobile suffix cannot match desktop",
);
assert(
  gpuIdentity("Radeon RX 6800M")?.kind === "mobile",
  "Radeon mobile suffix cannot match desktop",
);
assert(
  gpuIdentity("Radeon RX 6800M")?.base !== gpuIdentity("Radeon RX 6800S")?.base,
  "Radeon M and S variants stay separate",
);
assert(
  gpuIdentity("NVIDIA RTX 4500 Ada Generation")?.kind === "professional",
  "Ada workstation cards cannot become desktop gaming GPUs",
);
assert(
  gpuIdentity("GTX 960M")?.kind === "mobile",
  "legacy M suffix stays out of desktop gaming rankings",
);
assert(
  gpuIdentity("RTX 3050 A Laptop GPU")?.base !==
    gpuIdentity("RTX 3050 Laptop GPU")?.base,
  "different laptop GPU variants stay separate",
);
assert(
  gpuIdentity("Radeon RX 9060 XT LP")?.base !==
    gpuIdentity("Radeon RX 9060 XT")?.base,
  "LP variants do not inherit full power scores",
);
assert(
  gpuIdentity("NVIDIA RTX PRO 6000 Blackwell Max-Q Workstation Edition")
    ?.kind === "professional",
  "workstation Max-Q is not a laptop",
);
assert(
  gpuIdentity("RTX PRO 6000 Blackwell Server Edition")?.base !==
    gpuIdentity("RTX PRO 6000 Blackwell Workstation Edition")?.base,
  "server and workstation power variants remain separate",
);
assert(
  gpuIdentity("华硕 B650M 主板") === null,
  "unrelated inventory is not treated as GPU",
);
assert(
  gpuIdentity("RTX 5060 Ti 16G金属大师")?.memoryGb === 16,
  "Chinese suffix retains memory capacity",
);
assert(
  resolveBlenderGpuBenchmark(gpu16Gb, [
    { model: "NVIDIA GeForce RTX 5060 Ti", medianScore: 4000, samples: 10 },
  ]).score === null,
  "unspecified VRAM results cannot be assigned to a specific variant",
);
const expandedCatalog = buildGpuCatalog([
  "NVIDIA GeForce RTX 4090 Laptop GPU",
  "RTX 4090 48GB",
  "RTX 4080S",
  "Intel Arc A770M",
]);
assert(
  expandedCatalog.some((entry) => entry.kind === "mobile"),
  "source device names expand catalog dynamically",
);
assert(
  expandedCatalog.filter((entry) => entry.id === "RTX4080SUPER").length === 1,
  "source aliases are deduplicated",
);
assert(
  expandedCatalog.find((entry) => entry.id === "RTX4090-48GB")?.memoryGb === 48,
  "explicit conflicting memory never overwritten by base specs",
);
assert(
  expandedCatalog.find((entry) => entry.id === "RTX4090-48GB")
    ?.referencePowerW === undefined,
  "modified cards do not inherit official power specifications",
);
assert(
  relativePerformance(120, 80) === 150 &&
    relativePerformance(null, 80) === null &&
    relativePerformance(120, 0) === null,
  "relative performance requires two valid results",
);
const partialGame = resolveGpuBenchmark(
  GPU_RANKING_DATA[0],
  {
    model: "GeForce RTX 5090",
    raster: [null, { fps: 120, relativeScore: 80 }, null],
    rayTracing: [null, null, null],
  },
  "rayTracing",
  "1440p",
);
assert(
  partialGame.fps === null && partialGame.relativeScore === null,
  "missing project does not inherit raster FPS",
);
const linkState = {
  mode: "steelNomad" as const,
  resolution: "4k" as const,
  selected: ["RTX4090", "RTX5090D", "RTX5060TI-16GB"],
  baseline: "RTX5090D",
};
assert(
  JSON.stringify(parseRankingQuery(rankingQuery(linkState))) ===
    JSON.stringify(linkState),
  "comparison links round-trip selected variants and baseline",
);
const malicious = parseRankingQuery(
  "?test=bad&res=8k&compare=RTX4090,RTX4090,%3Cscript%3E,RTX5090,RTX5080,RTX5070,RTX5060&base=unselected",
);
assert(
  gpuIdentity("NVIDIA GeForce RTX 5090 (notebook)")?.kind === "mobile",
  "official notebook naming stays separate from desktop",
);
assert(
  gpuIdentity("RTX 3080 LHR")?.base !== gpuIdentity("RTX 3080")?.base,
  "LHR source entries cannot override the base card",
);
assert(
  gpuIdentity("GTX 1060 9 Gbps")?.base !== gpuIdentity("GTX 1060")?.base,
  "memory speed variants stay separate",
);
assert(
  gpuIdentity("Radeon AI Pro R9700") === null,
  "unrecognized Radeon PRO R9700 never becomes a Radeon R9 700",
);
assert(
  gpuIdentity("Radeon R9 700") === null,
  "invalid cached R9 model is rejected",
);
assert(
  gpuIdentity("蓝宝石 R9390 8G")?.base === "R9390",
  "known R9 short models remain recognized",
);
assert(
  resolveGpuRankingScore(
    GPU_RANKING_DATA[0],
    [
      {
        model: "GeForce RTX 5090",
        benchmark: "timeSpyGraphics",
        score: 47760,
        samples: null,
      },
    ],
    "timeSpyGraphics",
  ).samples === null,
  "unpublished sample counts remain unknown",
);
assert(
  malicious.mode === "raster" &&
    malicious.resolution === "1440p" &&
    malicious.selected.length === 4 &&
    malicious.baseline === "RTX4090",
  "share links validate and limit external parameters",
);
