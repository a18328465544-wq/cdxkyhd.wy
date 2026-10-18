import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  THREE_DMARK_RANKING_SOURCE,
  THREE_DMARK_RANKING_VERSION,
  ThreeDMarkRankingService,
  parseThreeDMarkRankingJson,
} from "./threeDMarkRankingService.js";

function dataFile() {
  return JSON.stringify({
    schemaVersion: 1,
    sourceUrl: THREE_DMARK_RANKING_SOURCE,
    sourceUpdatedAt: "2026-10-13T12:00:00Z",
    filtering: "valid-stock-only",
    models: [
      { model: "GeForce RTX 5090", timeSpyGraphicsScores: [30_000, 32_000, 31_000], portRoyalScores: [40_000, 44_000] },
      { model: "GeForce RTX 4090", timeSpyGraphicsScores: [25_000] },
    ],
  });
}

test("computes median Time Spy Graphics and Port Royal scores from screened samples", () => {
  assert.deepEqual(parseThreeDMarkRankingJson(dataFile()), [
    { model: "GeForce RTX 5090", benchmark: "timeSpyGraphics", score: 31_000, samples: 3 },
    { model: "GeForce RTX 5090", benchmark: "portRoyal", score: 42_000, samples: 2 },
    { model: "GeForce RTX 4090", benchmark: "timeSpyGraphics", score: 25_000, samples: 1 },
  ]);
  assert.throws(() => parseThreeDMarkRankingJson(JSON.stringify({ ...JSON.parse(dataFile()), filtering: "all-results" })), /valid stock-only/);
  assert.throws(() => parseThreeDMarkRankingJson(JSON.stringify({ ...JSON.parse(dataFile()), sourceUrl: "https://example.com/results" })), /official source/);
});

test("imports only when display authorization and a data file are configured", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "3dmark-ranking-"));
  const dataPath = path.join(directory, "approved-results.json");
  const cachePath = path.join(directory, "snapshot.json");
  await writeFile(dataPath, dataFile());
  try {
    const disabled = await ThreeDMarkRankingService.open({ cacheFile: cachePath, dataFile: dataPath, redistributionAllowed: false });
    assert.equal(disabled.getSnapshot(), null);
    assert.equal(disabled.getStatus().configured, false);

    const service = await ThreeDMarkRankingService.open({ cacheFile: cachePath, dataFile: dataPath, redistributionAllowed: true });
    assert.equal(service.getSnapshot()?.source, THREE_DMARK_RANKING_SOURCE);
    assert.equal(service.getSnapshot()?.version, THREE_DMARK_RANKING_VERSION);
    assert.equal(JSON.parse(await readFile(cachePath, "utf8")).models.length, 3);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("retains the previous snapshot if the imported file becomes invalid", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "3dmark-ranking-"));
  const dataPath = path.join(directory, "approved-results.json");
  const cachePath = path.join(directory, "snapshot.json");
  await writeFile(dataPath, dataFile());
  const service = await ThreeDMarkRankingService.open({ cacheFile: cachePath, dataFile: dataPath, redistributionAllowed: true });
  try {
    const first = service.getSnapshot();
    await writeFile(dataPath, "{}");
    const afterFailure = await service.refresh();
    assert.equal(afterFailure?.checkedAt, first?.checkedAt);
    assert.deepEqual(afterFailure?.models, first?.models);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("ignores malformed cached scores and rejects invalid source timestamps", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "3dmark-ranking-cache-"));
  const dataPath = path.join(directory, "approved-results.json");
  const cachePath = path.join(directory, "snapshot.json");
  await writeFile(dataPath, "{}");
  await writeFile(cachePath, JSON.stringify({
    source: THREE_DMARK_RANKING_SOURCE,
    version: THREE_DMARK_RANKING_VERSION,
    sourceUpdatedAt: "2026-10-13T12:00:00Z",
    checkedAt: "2026-10-13T12:00:00Z",
    updatedAt: "2026-10-13T12:00:00Z",
    models: [{ model: "GeForce RTX 5090", benchmark: "timeSpyGraphics", score: "fast", samples: 1 }],
  }));
  try {
    const service = await ThreeDMarkRankingService.open({ cacheFile: cachePath, dataFile: dataPath, redistributionAllowed: true });
    assert.equal(service.getSnapshot(), null);
    assert.throws(() => parseThreeDMarkRankingJson(JSON.stringify({
      ...JSON.parse(dataFile()),
      sourceUpdatedAt: 1_797_000_000_000,
    })), /official source/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
