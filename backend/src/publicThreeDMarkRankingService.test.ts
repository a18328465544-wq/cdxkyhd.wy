import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PublicThreeDMarkRankingService,
  PUBLIC_3DMARK_SOURCES,
  parsePublicThreeDMarkHtml,
} from "./publicThreeDMarkRankingService.js";

function fixture(
  benchmark: keyof typeof PUBLIC_3DMARK_SOURCES,
  extra = "",
  offset = 0,
  count = 42,
) {
  const rows = Array.from({ length: count }, (_, index) => {
    const name =
      index === 0
        ? "NVIDIA GeForce RTX 5090"
        : `NVIDIA GeForce RTX ${6000 + index}`;
    const score = 10000 - index + offset;
    return benchmark !== "steelNomad"
      ? `<li class="chart__row"><div class="chart__item">${name}${benchmark === "portRoyal" ? '<button class="chart__sub-items-button">6 Einzelwerte</button>' : ""}</div><div class="chart__label" data-value="${score}">${score}</div></li>`
      : `<tr><td>${index}</td><td><a>${name}</a></td><td>$999</td><td><div class="performance"><span class="bar-score">${score}</span></div></td><td>0.0</td></tr>`;
  }).join("");
  const title =
    benchmark === "timeSpyGraphics"
      ? "3DMark – Time Spy"
      : benchmark === "speedWay"
        ? "3DMark – Speed Way"
        : "Port Royal – GPU-Rating";
  const id =
    benchmark === "speedWay"
      ? "diagramm-3dmark-speed-way"
      : "diagramm-3dmark-time-spy";
  const header =
    benchmark === "timeSpyGraphics"
      ? "Graphics Score:"
      : benchmark === "speedWay"
        ? "Speedway Score:"
        : "Port Royal:";
  return benchmark !== "steelNomad"
    ? `<div id="${id}" data-title="${title}" class="chart"><div class="chart__group"><div class="chart__group-header">${header}</div>${rows}${extra}</div></div><div class="article-update"><table><tbody><tr><td>24. September 2026</td><td>New GPU</td></tr></tbody></table></div>`
    : `<main><p>The score is the median of all the results submitted by users.</p><table><thead><tr><th>Rank</th><th>Device</th><th>Price</th><th>3DMark Steel Nomad</th></tr></thead><tbody>${rows}${extra}</tbody></table></main>`;
}

test("extracts raw Graphics/Steel Nomad scores, not percentages or total Time Spy scores", () => {
  const parsed = parsePublicThreeDMarkHtml(
    fixture("timeSpyGraphics"),
    "timeSpyGraphics",
  );
  assert.equal(parsed.models.length, 42);
  assert.equal(parsed.models[0].score, 10000);
  assert.equal(parsed.models[0].samples, null);
  assert.equal(parsed.sourceUpdatedAt, "2026-09-24");
  assert.equal(
    parsePublicThreeDMarkHtml(fixture("steelNomad"), "steelNomad").models[0]
      .score,
    10000,
  );
  assert.throws(
    () =>
      parsePublicThreeDMarkHtml(
        fixture("timeSpyGraphics").replace("Graphics Score:", "Total Score:"),
        "timeSpyGraphics",
      ),
    /Graphics/,
  );
  assert.throws(
    () =>
      parsePublicThreeDMarkHtml(
        fixture("steelNomad").replace(
          "3DMark Steel Nomad",
          "3DMark Steel Nomad Light",
        ),
        "steelNomad",
      ),
    /Steel Nomad/,
  );
  assert.throws(
    () =>
      parsePublicThreeDMarkHtml(
        fixture("steelNomad").replace(
          "median of all the results",
          "best score",
        ),
        "steelNomad",
      ),
    /methodology/,
  );
});

test("excludes ambiguous same-name values rather than selecting the highest score", () => {
  const extra = `<tr><td>99</td><td><a>NVIDIA GeForce RTX 5090</a></td><td>$999</td><td><div class="performance"><span class="bar-score">9000</span></div></td></tr>`;
  const parsed = parsePublicThreeDMarkHtml(
    fixture("steelNomad", extra),
    "steelNomad",
  );
  assert.equal(parsed.models.length, 41);
  assert.ok(!parsed.models.some((model) => model.model === "GeForce RTX 5090"));
});

test("retains per-test reference on HTTP 403 and refreshes the other test independently", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "public-3dmark-"));
  let denied = false;
  const service = await PublicThreeDMarkRankingService.open({
    cacheFile: path.join(directory, "cache.json"),
    refreshIntervalMs: 0,
    fetcher: async (url) => {
      const benchmark = (
        Object.keys(
          PUBLIC_3DMARK_SOURCES,
        ) as (keyof typeof PUBLIC_3DMARK_SOURCES)[]
      ).find((key) => PUBLIC_3DMARK_SOURCES[key].source === String(url))!;
      const timeSpy = benchmark === "timeSpyGraphics";
      return denied && timeSpy
        ? new Response("Forbidden", { status: 403 })
        : new Response(fixture(benchmark, "", denied ? 5 : 0));
    },
  });
  try {
    const first = await service.refresh();
    denied = true;
    const second = await service.refresh();
    assert.deepEqual(
      second?.models.filter((model) => model.benchmark === "timeSpyGraphics"),
      first?.models.filter((model) => model.benchmark === "timeSpyGraphics"),
    );
    assert.equal(
      second?.sources?.timeSpyGraphics?.checkedAt,
      first?.sources?.timeSpyGraphics?.checkedAt,
    );
    assert.equal(second?.sources?.timeSpyGraphics?.refreshFailed, true);
    assert.equal(second?.sources?.timeSpyGraphics?.reason, "源站返回 HTTP 403");
    assert.equal(second?.sources?.steelNomad?.refreshFailed, false);
    assert.equal(
      second?.models.find((model) => model.benchmark === "steelNomad")?.score,
      10005,
    );
    const reopened = await PublicThreeDMarkRankingService.open({
      cacheFile: path.join(directory, "cache.json"),
    });
    assert.deepEqual(reopened.getSnapshot(), second);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("throttles retries and loads the verified reference even if the disk cache is corrupt", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "public-3dmark-seed-"),
  );
  let calls = 0;
  const cacheFile = path.join(directory, "cache.json");
  await writeFile(cacheFile, "{}");
  const seedFile = fileURLToPath(
    new URL("../data/3dmark-public-reference.json", import.meta.url),
  );
  try {
    const service = await PublicThreeDMarkRankingService.open({
      cacheFile,
      seedFile,
      fetcher: async () => {
        calls += 1;
        return new Response("Unavailable", { status: 503 });
      },
    });
    assert.equal(
      service
        .getSnapshot()
        ?.models.filter((model) => model.benchmark === "timeSpyGraphics")
        .length,
      107,
    );
    assert.equal(
      service
        .getSnapshot()
        ?.models.find(
          (model) =>
            model.model === "GeForce RTX 5090" &&
            model.benchmark === "timeSpyGraphics",
        )?.score,
      47760,
    );
    assert.ok(
      service
        .getSnapshot()
        ?.models.every((model) =>
          model.benchmark === "portRoyal"
            ? model.samples !== null
            : model.samples === null,
        ),
    );
    await Promise.all([service.refresh(), service.refresh()]);
    await service.refresh();
    assert.equal(calls, 4);
    assert.ok((await readFile(cacheFile, "utf8")).includes("47760"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("reads Speed Way independently and excludes Port Royal single-result/hidden charts", () => {
  assert.equal(
    parsePublicThreeDMarkHtml(fixture("speedWay"), "speedWay").models[0]
      .benchmark,
    "speedWay",
  );
  const hidden =
    '<li class="chart__row chart__row--sub-item" hidden><div class="chart__item">RTX 5090</div><div class="chart__label" data-value="99999"></div></li>';
  const port = parsePublicThreeDMarkHtml(
    fixture("portRoyal", hidden),
    "portRoyal",
  );
  assert.equal(port.models.length, 42);
  assert.equal(port.models[0].score, 10000);
  assert.equal(port.models[0].samples, 6);
  assert.throws(
    () =>
      parsePublicThreeDMarkHtml(
        fixture("portRoyal").replace(
          "Port Royal – GPU-Rating",
          "Port Royal – Einzelergebnisse",
        ),
        "portRoyal",
      ),
    /chart/,
  );
  assert.throws(
    () =>
      parsePublicThreeDMarkHtml(
        fixture("portRoyal").replace("6 Einzelwerte", "unknown"),
        "portRoyal",
      ),
    /sample count/,
  );
  assert.throws(
    () =>
      parsePublicThreeDMarkHtml(
        fixture("speedWay").replace("Speedway Score:", "Graphics Score:"),
        "speedWay",
      ),
    /chart/,
  );
});

test("older two-project runtime cache does not erase newly bundled projects", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "public-3dmark-merge-"),
  );
  const seedFile = fileURLToPath(
    new URL("../data/3dmark-public-reference.json", import.meta.url),
  );
  const seed = JSON.parse(await readFile(seedFile, "utf8"));
  const older = {
    ...seed,
    checkedAt: "2026-01-01T00:00:00Z",
    models: seed.models.filter((row: { benchmark: string }) =>
      ["timeSpyGraphics", "steelNomad"].includes(row.benchmark),
    ),
    sources: {
      timeSpyGraphics: {
        ...seed.sources.timeSpyGraphics,
        checkedAt: "2026-01-01T00:00:00Z",
      },
      steelNomad: {
        ...seed.sources.steelNomad,
        checkedAt: "2026-01-01T00:00:00Z",
      },
    },
  };
  try {
    const cacheFile = path.join(directory, "cache.json");
    await writeFile(cacheFile, JSON.stringify(older));
    const service = await PublicThreeDMarkRankingService.open({
      cacheFile,
      seedFile,
    });
    assert.ok(
      service.getSnapshot()?.models.some((row) => row.benchmark === "speedWay"),
    );
    assert.ok(
      service
        .getSnapshot()
        ?.models.some((row) => row.benchmark === "portRoyal"),
    );
    assert.equal(
      service.getSnapshot()?.sources?.timeSpyGraphics?.checkedAt,
      seed.sources.timeSpyGraphics.checkedAt,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("rejects a partial source refresh without discarding the previous complete project", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "public-3dmark-shrink-"),
  );
  let count = 80;
  const service = await PublicThreeDMarkRankingService.open({
    cacheFile: path.join(directory, "cache.json"),
    refreshIntervalMs: 0,
    fetcher: async (url) => {
      const benchmark = (
        Object.keys(
          PUBLIC_3DMARK_SOURCES,
        ) as (keyof typeof PUBLIC_3DMARK_SOURCES)[]
      ).find((key) => PUBLIC_3DMARK_SOURCES[key].source === String(url))!;
      return new Response(fixture(benchmark, "", 0, count));
    },
  });
  try {
    await service.refresh();
    assert.equal(service.getSnapshot()?.models.length, 320);
    count = 42;
    await service.refresh();
    assert.equal(service.getSnapshot()?.models.length, 320);
    assert.equal(service.getSnapshot()?.sources?.speedWay?.refreshFailed, true);
    assert.match(
      service.getSnapshot()?.sources?.speedWay?.reason ?? "",
      /数量异常减少/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
