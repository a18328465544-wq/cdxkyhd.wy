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
  benchmark: "timeSpyGraphics" | "steelNomad",
  extra = "",
  offset = 0,
) {
  const rows = Array.from({ length: 42 }, (_, index) => {
    const name =
      index === 0
        ? "NVIDIA GeForce RTX 5090"
        : `NVIDIA GeForce RTX ${6000 + index}`;
    const score = 10000 - index + offset;
    return benchmark === "timeSpyGraphics"
      ? `<li class="chart__row"><div class="chart__item">${name}</div><div class="chart__label" data-value="${score}">${score}</div></li>`
      : `<tr><td>${index}</td><td><a>${name}</a></td><td>$999</td><td><div class="performance"><span class="bar-score">${score}</span></div></td><td>0.0</td></tr>`;
  }).join("");
  return benchmark === "timeSpyGraphics"
    ? `<div id="diagramm-3dmark-time-spy" data-title="3DMark – Time Spy"><div class="chart__group"><div class="chart__group-header">Graphics Score:</div>${rows}${extra}</div></div><div class="article-update"><table><tbody><tr><td>24. September 2026</td><td>New GPU</td></tr></tbody></table></div>`
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
      const timeSpy =
        String(url) === PUBLIC_3DMARK_SOURCES.timeSpyGraphics.source;
      return denied && timeSpy
        ? new Response("Forbidden", { status: 403 })
        : new Response(
            fixture(
              timeSpy ? "timeSpyGraphics" : "steelNomad",
              "",
              denied ? 5 : 0,
            ),
          );
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
      service.getSnapshot()?.models.every((model) => model.samples === null),
    );
    await Promise.all([service.refresh(), service.refresh()]);
    await service.refresh();
    assert.equal(calls, 2);
    assert.ok((await readFile(cacheFile, "utf8")).includes("47760"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
