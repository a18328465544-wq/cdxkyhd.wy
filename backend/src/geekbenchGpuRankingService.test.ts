import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  GEEKBENCH_GPU_RANKING_SOURCE,
  GEEKBENCH_GPU_RANKING_VERSION,
  GeekbenchGpuRankingService,
  buildGeekbenchGpuSearchUrl,
  parseGeekbenchGpuSearchJson,
} from "./geekbenchGpuRankingService.js";

const result = (id: number, device: string, api: string, score: number, valid = true) => ({
  id,
  is_visible: valid,
  created_at: "2026-10-14T00:00:00Z",
  document: {
    gpu_device_name: device,
    gpu_platform_name: api,
    score,
    valid: valid ? 1 : 0,
    complete_benchmark: 1,
  },
});

test("builds an authenticated Geekbench 7 GPU search query", () => {
  const url = buildGeekbenchGpuSearchUrl("GeForce RTX 5090");
  assert.equal(url.origin, GEEKBENCH_GPU_RANKING_SOURCE);
  assert.equal(url.pathname, "/api/v1/gpu_v7/search");
  assert.equal(url.searchParams.get("query"), "GeForce RTX 5090");
  assert.equal(url.searchParams.get("sort_field"), "created_at");
  assert.equal(url.searchParams.get("sort_direction"), "desc");
  assert.equal(url.searchParams.get("per_page"), "100");
});

test("aggregates only visible, complete results for the exact GPU and API", () => {
  const json = JSON.stringify({ data: [
    result(1, "NVIDIA GeForce RTX 5090", "Vulkan", 300_000),
    result(2, "NVIDIA GeForce RTX 5090", "Vulkan", 310_000),
    result(3, "NVIDIA GeForce RTX 5090", "OpenCL", 290_000),
    result(4, "NVIDIA GeForce RTX 5090", "NVIDIA CUDA", 320_000),
    result(5, "NVIDIA GeForce RTX 5090 D", "Vulkan", 380_000),
    result(6, "NVIDIA GeForce RTX 5090 Laptop GPU", "Vulkan", 200_000),
    result(7, "NVIDIA GeForce RTX 5090", "Vulkan", 500_000, false),
  ] });
  assert.deepEqual(parseGeekbenchGpuSearchJson(json, "GeForce RTX 5090"), [
    { model: "GeForce RTX 5090", benchmark: "geekbenchVulkan", score: 305_000, samples: 2 },
    { model: "GeForce RTX 5090", benchmark: "geekbenchOpencl", score: 290_000, samples: 1 },
    { model: "GeForce RTX 5090", benchmark: "geekbenchCuda", score: 320_000, samples: 1 },
  ]);
  assert.throws(() => parseGeekbenchGpuSearchJson("{}", "GeForce RTX 5090"), /format changed/);
});

test("does not make Geekbench requests until a key and display authorization are configured", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "geekbench-ranking-"));
  let requests = 0;
  const service = await GeekbenchGpuRankingService.open({
    cacheFile: path.join(directory, "snapshot.json"),
    apiKey: "",
    redistributionAllowed: true,
    modelNames: ["GeForce RTX 5090"],
    fetcher: async () => { requests += 1; return Response.json({ data: [] }); },
  });
  try {
    await service.refresh();
    assert.equal(requests, 0);
    assert.deepEqual(service.getStatus(), { configured: false, reason: "缺少 Geekbench API Key" });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("keeps the last valid Geekbench snapshot if the source fails", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "geekbench-ranking-"));
  const cacheFile = path.join(directory, "snapshot.json");
  let unavailable = false;
  const service = await GeekbenchGpuRankingService.open({
    cacheFile,
    apiKey: "test-only",
    redistributionAllowed: true,
    modelNames: ["GeForce RTX 5090"],
    fetcher: async (_input, init) => {
      assert.equal(new Headers(init?.headers).get("authorization"), "Bearer test-only");
      return unavailable ? new Response("", { status: 503 }) : Response.json({ data: [result(42, "NVIDIA GeForce RTX 5090", "Vulkan", 374_231)] });
    },
  });
  try {
    const first = await service.refresh();
    assert.equal(first?.source, GEEKBENCH_GPU_RANKING_SOURCE);
    assert.equal(first?.version, GEEKBENCH_GPU_RANKING_VERSION);
    assert.equal(first?.models[0].score, 374_231);
    assert.equal(JSON.parse(await readFile(cacheFile, "utf8")).models.length, 1);
    unavailable = true;
    const afterFailure = await service.refresh();
    assert.equal(afterFailure?.checkedAt, first?.checkedAt);
    assert.deepEqual(afterFailure?.models, first?.models);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
