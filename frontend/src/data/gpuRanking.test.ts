import { GPU_RANKING_DATA, gpuIdentity, gpuInventoryMatches, isGpuInventoryAvailable, resolveBlenderGpuBenchmark, resolveGpuBenchmark, resolveGpuRankingScore } from "./gpuRanking";
import { GPU_RANKING_MODEL_NAMES } from "../../../shared/src/gpuRankingModels.ts";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(GPU_RANKING_DATA.length === 48, "the source test set should contain all 48 ranked GPUs");
assert(GPU_RANKING_DATA.map(entry => entry.model).join("|") === GPU_RANKING_MODEL_NAMES.join("|"), "shared external benchmark queries must cover the visible GPU catalog in display order");
assert(GPU_RANKING_DATA.every(entry => entry.raster.length === 3 && entry.rayTracing.length === 3), "every GPU should have scores for all resolutions and test modes");
assert(GPU_RANKING_DATA.every(entry => [...entry.raster, ...entry.rayTracing].every(score => Number.isFinite(score) && score > 0 && score <= 100)), "scores should be finite percentages normalized to the source reference GPU");

const fallbackBenchmark = resolveGpuBenchmark(GPU_RANKING_DATA[0], undefined, "raster", "1440p");
assert(fallbackBenchmark.relativeScore === 100 && fallbackBenchmark.fps === null, "relative baseline remains visible without inventing FPS");
const syncedBenchmark = resolveGpuBenchmark(GPU_RANKING_DATA[0], {
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
}, "rayTracing", "4k");
assert(syncedBenchmark.relativeScore === 100 && syncedBenchmark.fps === 64.1, "selected test mode and resolution use source FPS");

const blenderBenchmark = resolveBlenderGpuBenchmark(GPU_RANKING_DATA[0], [
  { model: "NVIDIA GeForce RTX 5090", medianScore: 16_094.6, samples: 158 },
  { model: "NVIDIA GeForce RTX 5090 D", medianScore: 17_418.9, samples: 2 },
]);
assert(blenderBenchmark.score === 16_094.6 && blenderBenchmark.samples === 158, "Blender scores preserve source median and sample count");
assert(resolveBlenderGpuBenchmark(GPU_RANKING_DATA[0], []).score === null, "missing Blender data is not fabricated");
assert(resolveBlenderGpuBenchmark(GPU_RANKING_DATA[0], [{ model: "NVIDIA GeForce RTX 5090 D", medianScore: 17_418.9, samples: 2 }]).score === null, "GPU variants do not inherit another card's score");
const externalScore = resolveGpuRankingScore(GPU_RANKING_DATA[0], [
  { model: "NVIDIA GeForce RTX 5090", benchmark: "geekbenchVulkan", score: 374_231, samples: 16 },
], "geekbenchVulkan");
assert(externalScore.score === 374_231 && externalScore.samples === 16, "external benchmark scores resolve by GPU model and test");
assert(resolveGpuRankingScore(GPU_RANKING_DATA[0], [{ model: "NVIDIA GeForce RTX 5090 D", benchmark: "geekbenchVulkan", score: 374_326, samples: 16 }], "geekbenchVulkan").score === null, "external GPU variants remain separate");
const gpu8Gb = GPU_RANKING_DATA.find(entry => entry.model === "GeForce RTX 5060 Ti 8GB")!;
assert(resolveGpuRankingScore(gpu8Gb, [{ model: "NVIDIA GeForce RTX 5060 Ti 16GB", benchmark: "timeSpyGraphics", score: 20_000, samples: 12 }], "timeSpyGraphics").score === null, "external VRAM-specific scores stay with the matching variant");
assert(gpuIdentity("NVIDIA GeForce RTX 5090 Laptop GPU")?.base === "RTX5090MOBILE", "mobile GPU scores remain separate from desktop cards");
const desktopPreferred = resolveBlenderGpuBenchmark(GPU_RANKING_DATA[0], [
  { model: "NVIDIA GeForce RTX 5090 Laptop GPU", medianScore: 8_071.6, samples: 500 },
  { model: "NVIDIA GeForce RTX 5090", medianScore: 16_094.6, samples: 158 },
]);
assert(desktopPreferred.score === 16_094.6, "desktop cards do not inherit higher-sample laptop results");
const gpu16Gb = GPU_RANKING_DATA.find(entry => entry.model === "GeForce RTX 5060 Ti 16GB")!;
assert(resolveBlenderGpuBenchmark(gpu16Gb, [{ model: "NVIDIA GeForce RTX 5060 Ti 8GB", medianScore: 4_000, samples: 60 }]).score === null, "VRAM-specific Blender data stays with the matching card variant");

assert(gpuInventoryMatches("GeForce RTX 4090", "影驰 RTX4090 24G OC"), "AIB suffixes and spacing should not block an exact GPU model match");
assert(!gpuInventoryMatches("GeForce RTX 5090", "RTX 5090D 32GB"), "a D variant must not inherit the base GPU's ranking or stock flag");
assert(gpuInventoryMatches("GeForce RTX 5060 Ti 16GB", "RTX5060Ti 16G"), "VRAM-specific variants should match when capacities agree");
assert(!gpuInventoryMatches("GeForce RTX 5060 Ti 16GB", "RTX 5060 Ti 8GB"), "different VRAM variants must not be conflated");
assert(!gpuInventoryMatches("Radeon RX 7900 XTX", "Radeon RX 7900 XT 20GB"), "XTX and XT models must remain distinct");
assert(gpuIdentity("Intel Arc B580")?.base === "ARCB580", "Intel model identity should normalize consistently");
assert(isGpuInventoryAvailable({ quantity: 1, status: "已入库" }), "received inventory should appear as in stock");
assert(isGpuInventoryAvailable({ quantity: 2, status: "已上架" }), "listed inventory should appear as in stock");
assert(!isGpuInventoryAvailable({ quantity: 0, status: "已入库" }), "zero quantity must not appear as in stock");
assert(!isGpuInventoryAvailable({ quantity: 1, status: "已出库" }), "shipped inventory must not appear as in stock");
