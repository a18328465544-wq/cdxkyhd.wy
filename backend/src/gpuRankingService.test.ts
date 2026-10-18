import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { GpuRankingService, GPU_RANKING_SOURCE, parseGpuRankingHtml } from "./gpuRankingService.js";

function rankingTable(title: string, multiplier: number) {
  const rows = Array.from({ length: 40 }, (_, index) => {
    const fps = 100 - index + multiplier;
    return `<tr><td>Graphics Card ${index + 1}</td><td>$499</td><td>${(100 - index).toFixed(1)}% (${fps.toFixed(1)})</td><td>${(90 - index).toFixed(1)}% (${(fps - 10).toFixed(1)})</td><td>${(80 - index).toFixed(1)}% (${(fps - 20).toFixed(1)})</td></tr>`;
  }).join("");
  return `<div class="table__container"><h3>${title}</h3><table><thead><tr><th>Graphics Card</th><th>MSRP</th><th>1080p Ultra</th><th>1440p Ultra</th><th>4K Ultra</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function sourceHtml(multiplier = 0, includeTables = true) {
  const tables = includeTables
    ? `${rankingTable("GPU Benchmarks Hierarchy — Rasterization Performance", multiplier)}${rankingTable("GPU Benchmarks Hierarchy — Ray Tracing Performance", multiplier)}`
    : "<html><body>Source layout changed</body></html>";
  return `<html><head><meta property="article:modified_time" content="2026-06-24T21:35:42Z"></head><body>${tables}</body></html>`;
}

test("parses source FPS and relative scores for all resolutions and modes", () => {
  const parsed = parseGpuRankingHtml(sourceHtml());
  assert.equal(parsed.models.length, 40);
  assert.equal(parsed.sourceUpdatedAt, "2026-06-24T21:35:42.000Z");
  assert.deepEqual(parsed.models[0], {
    model: "Graphics Card 1",
    raster: [
      { relativeScore: 100, fps: 100 },
      { relativeScore: 90, fps: 90 },
      { relativeScore: 80, fps: 80 },
    ],
    rayTracing: [
      { relativeScore: 100, fps: 100 },
      { relativeScore: 90, fps: 90 },
      { relativeScore: 80, fps: 80 },
    ],
  });
  assert.throws(() => parseGpuRankingHtml(sourceHtml(0, false)), /tables were not found/);
});

test("keeps the last valid benchmark snapshot when a later source response is invalid", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "gpu-ranking-"));
  const cacheFile = path.join(directory, "snapshot.json");
  let sourceUnavailable = false;
  const service = await GpuRankingService.open({
    cacheFile,
    fetcher: async () => new Response(sourceUnavailable ? sourceHtml(0, false) : sourceHtml()),
  });

  try {
    const first = await service.refresh();
    assert.equal(first?.models.length, 40);
    assert.equal(first?.source, GPU_RANKING_SOURCE);
    assert.equal(JSON.parse(await readFile(cacheFile, "utf8")).models.length, 40);

    sourceUnavailable = true;
    const afterFailure = await service.refresh();
    assert.equal(afterFailure?.checkedAt, first?.checkedAt);
    assert.deepEqual(afterFailure?.models, first?.models);
    assert.equal(service.getStatus().refreshFailed, true);
    assert.ok(service.getStatus().lastAttemptAt);

    const reloaded = await GpuRankingService.open({ cacheFile });
    assert.deepEqual(reloaded.getSnapshot()?.models, first?.models);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("retains raster-only older GPUs and unavailable resolution cells without manufacturing ray tracing", () => {
  const raster = rankingTable("Rasterization Performance", 0).replace("Graphics Card 1", "GeForce GTX 1080").replace("80.0% (80.0)", "N/A");
  const rays = rankingTable("Ray Tracing Performance", 0).replace(/<tr><td>Graphics Card 1<\/td>.*?<\/tr>/, "");
  const parsed = parseGpuRankingHtml(raster + rays);
  const old = parsed.models.find(model => model.model === "GeForce GTX 1080")!;
  assert.equal(old.raster[0]?.fps, 100);
  assert.equal(old.raster[2], null);
  assert.deepEqual(old.rayTracing, [null, null, null]);
  assert.equal(parseGpuRankingHtml(raster).models.length, 40);
  assert.throws(() => parseGpuRankingHtml(raster.replace("100.0% (100.0)", "broken")), /Invalid/);
  assert.throws(() => parseGpuRankingHtml(raster.replace(/<tr><td>Graphics Card 2<\/td>.*?<\/tr>/, "")), /incomplete/);
});
