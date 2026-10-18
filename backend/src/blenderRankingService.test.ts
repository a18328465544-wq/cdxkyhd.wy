import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  BLENDER_RANKING_SOURCE,
  BLENDER_RANKING_VERSION,
  BlenderGpuRankingService,
  buildBlenderRankingUrl,
  parseBlenderRankingJson,
} from "./blenderRankingService.js";

function sourceJson(score = 16_000) {
  return JSON.stringify({
    columns: [
      { display_name: "Device Name" },
      { display_name: "Median Score" },
      { display_name: "Number of Benchmarks" },
    ],
    rows: Array.from({ length: 120 }, (_, index) => [
      index === 0 ? "NVIDIA GeForce RTX 5090" : `Graphics Device ${index}`,
      score - index,
      index === 0 ? 158 : 10 + index,
    ]),
  });
}

test("requests a single Blender version and the supported GPU rendering backends", () => {
  const url = buildBlenderRankingUrl();
  assert.equal(url.origin + url.pathname, BLENDER_RANKING_SOURCE);
  assert.deepEqual(url.searchParams.getAll("compute_type"), ["OPTIX", "CUDA", "HIP", "METAL", "ONEAPI"]);
  assert.equal(url.searchParams.get("blender_version"), BLENDER_RANKING_VERSION);
  assert.equal(url.searchParams.get("group_by"), "device_name");
  assert.equal(url.searchParams.get("response_type"), "datatables");
});

test("parses Blender median scores and sample counts without changing units", () => {
  const models = parseBlenderRankingJson(sourceJson());
  assert.equal(models.length, 120);
  assert.deepEqual(models[0], { model: "NVIDIA GeForce RTX 5090", medianScore: 16_000, samples: 158 });
  assert.throws(() => parseBlenderRankingJson(JSON.stringify({ columns: [], rows: [] })), /format changed/);
  assert.throws(() => parseBlenderRankingJson(sourceJson(0)), /invalid score/);
});

test("keeps the last valid Blender score snapshot if the source stops returning valid data", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "blender-ranking-"));
  const cacheFile = path.join(directory, "snapshot.json");
  let sourceUnavailable = false;
  const service = await BlenderGpuRankingService.open({
    cacheFile,
    fetcher: async () => new Response(sourceUnavailable ? "{}" : sourceJson()),
  });

  try {
    const first = await service.refresh();
    assert.equal(first?.models.length, 120);
    assert.equal(first?.source, BLENDER_RANKING_SOURCE);
    assert.equal(first?.version, BLENDER_RANKING_VERSION);
    assert.equal(JSON.parse(await readFile(cacheFile, "utf8")).models.length, 120);

    sourceUnavailable = true;
    const afterFailure = await service.refresh();
    assert.equal(afterFailure?.checkedAt, first?.checkedAt);
    assert.deepEqual(afterFailure?.models, first?.models);

    const reloaded = await BlenderGpuRankingService.open({ cacheFile });
    assert.deepEqual(reloaded.getSnapshot()?.models, first?.models);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
