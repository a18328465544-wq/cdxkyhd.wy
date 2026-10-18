import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import {
  gpuIdentity,
  gpuModelKey,
  type GpuRankingBenchmarkSource,
  type GpuRankingScoreModel,
  type GpuRankingScoreSnapshot,
} from "@cdxkyhd/shared";

export const PUBLIC_3DMARK_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;
export const PUBLIC_3DMARK_VERSION = "3DMark public reference v1";
export const PUBLIC_3DMARK_SOURCES = {
  timeSpyGraphics: {
    source:
      "https://www.computerbase.de/artikel/grafikkarten/3dmark-time-spy-benchmark.88185/",
    name: "ComputerBase 编辑部实测",
    methodology: "review" as const,
  },
  steelNomad: {
    source: "https://benchmarks.ul.com/compare/best-gpus",
    name: "UL 官方公开中位数",
    methodology: "public-median" as const,
  },
  speedWay: {
    source:
      "https://www.computerbase.de/artikel/grafikkarten/3dmark-speed-way-benchmark.88644/",
    name: "ComputerBase 编辑部实测",
    methodology: "review" as const,
  },
  portRoyal: {
    source:
      "https://www.computerbase.de/artikel/grafikkarten/3dmark-community-benchmark.97826/seite-4",
    name: "ComputerBase 社区汇总（含超频）",
    methodology: "community-rating" as const,
  },
};
type PublicBenchmark = keyof typeof PUBLIC_3DMARK_SOURCES;
const TESTS = Object.keys(PUBLIC_3DMARK_SOURCES) as PublicBenchmark[];
const MAX_BYTES = 3_000_000;

function modelRow(
  name: string,
  value: string | undefined,
  benchmark: PublicBenchmark,
): GpuRankingScoreModel | null {
  const identity = gpuIdentity(name);
  if (!identity) return null;
  const score = Number(value?.trim());
  if (
    !value?.trim() ||
    !Number.isFinite(score) ||
    score <= 0 ||
    score > 1_000_000
  )
    throw new Error("Invalid public 3DMark score");
  return {
    model: `${identity.canonicalModel}${identity.memoryGb ? ` ${identity.memoryGb}GB` : ""}`,
    benchmark,
    score,
    samples: null,
  };
}

export function parsePublicThreeDMarkHtml(
  html: string,
  benchmark: PublicBenchmark,
) {
  if (Buffer.byteLength(html, "utf8") > MAX_BYTES)
    throw new Error("Public 3DMark page exceeded size limit");
  const $ = load(html);
  const models: GpuRankingScoreModel[] = [];
  if (benchmark !== "steelNomad") {
    const selectors = {
      timeSpyGraphics: {
        id: "#diagramm-3dmark-time-spy",
        title: /^3DMark\s*[–-]\s*Time Spy$/,
        header: "Graphics Score:",
      },
      speedWay: {
        id: "#diagramm-3dmark-speed-way",
        title: /^3DMark\s*[–-]\s*Speed Way$/,
        header: "Speedway Score:",
      },
      portRoyal: {
        id: '.chart[data-title="Port Royal – GPU-Rating"]',
        title: /^Port Royal\s*[–-]\s*GPU-Rating$/,
        header: "Port Royal:",
      },
    };
    const spec = selectors[benchmark];
    const chart = $(spec.id);
    if (
      chart.length !== 1 ||
      !spec.title.test(chart.attr("data-title") ?? "") ||
      chart.find(".chart__group").length !== 1 ||
      chart.find(".chart__group-header").text().trim() !== spec.header
    )
      throw new Error(
        `${benchmark === "timeSpyGraphics" ? "Time Spy Graphics" : benchmark} chart was not found`,
      );
    chart.find(".chart__row:not(.chart__row--sub-item)").each((_, element) => {
      const item = $(element).find(".chart__item").clone();
      item.find("button").remove();
      const row = modelRow(
        item.text().replace(/\s+/g, " ").trim(),
        $(element).find(".chart__label").attr("data-value"),
        benchmark,
      );
      if (row && benchmark === "portRoyal") {
        const count = $(element)
          .find(".chart__sub-items-button")
          .text()
          .trim()
          .match(/^(\d+) Einzelwerte?$/);
        if (!count || Number(count[1]) < 1 || Number(count[1]) > 1_000_000)
          throw new Error("Invalid Port Royal sample count");
        row.samples = Number(count[1]);
      }
      if (row) models.push(row);
    });
  } else {
    const table = $("table").filter((_, element) =>
      $(element).find("thead").text().includes("3DMark Steel Nomad"),
    );
    if (
      table.length !== 1 ||
      /Steel Nomad Light/.test(table.find("thead").text())
    )
      throw new Error("Official Steel Nomad table was not found");
    table.find("tbody tr").each((_, element) => {
      const cells = $(element).find("td");
      const row = modelRow(
        cells.eq(1).find("a").first().text().trim(),
        cells.eq(3).find(".performance .bar-score").text(),
        benchmark,
      );
      if (row) models.push(row);
    });
    if (!$("main").text().includes("median of all the results"))
      throw new Error("Official median methodology could not be verified");
  }
  const groups = new Map<string, GpuRankingScoreModel[]>();
  for (const model of models) {
    const key = gpuModelKey(model.model)!;
    groups.set(key, [...(groups.get(key) ?? []), model]);
  }
  const unambiguous = [...groups.values()]
    .filter((rows) => rows.every((row) => row.score === rows[0].score))
    .map((rows) => rows[0]);
  if (unambiguous.length < 40)
    throw new Error("Public 3DMark models incomplete or ambiguous");
  let sourceUpdatedAt: string | null = null;
  if (benchmark !== "steelNomad") {
    const months = [
      "Januar",
      "Februar",
      "März",
      "April",
      "Mai",
      "Juni",
      "Juli",
      "August",
      "September",
      "Oktober",
      "November",
      "Dezember",
    ];
    const dates: string[] = [];
    $(".article-update table tbody tr").each((_, row) => {
      const match = $(row)
        .find("td")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim()
        .match(/^(\d{1,2})\. (\S+) (\d{4})$/);
      if (!match || !months.includes(match[2])) return;
      const date = `${match[3]}-${String(months.indexOf(match[2]) + 1).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
      if (
        new Date(date).toISOString().startsWith(date) &&
        Date.parse(date) <= Date.now()
      )
        dates.push(date);
    });
    sourceUpdatedAt = dates.sort().at(-1) ?? null;
    if (!sourceUpdatedAt) {
      const times = $(
        "article time[datetime], .article-update time[datetime], time[itemprop='dateModified']",
      )
        .map((_, element) => $(element).attr("datetime"))
        .get();
      sourceUpdatedAt =
        times
          .filter(
            (value) =>
              Number.isFinite(Date.parse(value)) &&
              Date.parse(value) <= Date.now(),
          )
          .sort((a, b) => Date.parse(a) - Date.parse(b))
          .at(-1) ?? null;
    }
  }
  return { models: unambiguous, sourceUpdatedAt };
}

interface Options {
  cacheFile: string;
  seedFile?: string;
  fetcher?: typeof fetch;
  refreshIntervalMs?: number;
}

export class PublicThreeDMarkRankingService {
  private snapshot: GpuRankingScoreSnapshot | null = null;
  private refreshInFlight: Promise<GpuRankingScoreSnapshot | null> | null =
    null;
  private lastAttempt = 0;
  private readonly fetcher: typeof fetch;
  private failures: Partial<Record<PublicBenchmark, string>> = {};
  constructor(private readonly options: Options) {
    this.fetcher = options.fetcher ?? fetch;
  }

  static async open(options: Options) {
    const service = new PublicThreeDMarkRankingService(options);
    if (options.seedFile) await service.readSnapshot(options.seedFile);
    await service.readSnapshot(options.cacheFile);
    return service;
  }
  getSnapshot() {
    return this.snapshot;
  }
  getStatus() {
    return {
      configured: true,
      refreshFailed:
        Object.keys(this.failures).length > 0 ||
        Object.values(this.snapshot?.sources ?? {}).some(
          (source) => source?.refreshFailed,
        ),
      reason: this.snapshot
        ? "已接入公开参考成绩，来源与统计口径按项目分别标注"
        : "正在同步公开参考成绩",
    };
  }
  refresh() {
    if (this.refreshInFlight) return this.refreshInFlight;
    if (
      Date.now() - this.lastAttempt <
      (this.options.refreshIntervalMs ?? PUBLIC_3DMARK_REFRESH_INTERVAL_MS)
    )
      return Promise.resolve(this.snapshot);
    this.lastAttempt = Date.now();
    this.refreshInFlight = this.fetchAndStore().finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
  }
  private async readSnapshot(file: string) {
    try {
      const parsed = JSON.parse(
        await readFile(file, "utf8"),
      ) as GpuRankingScoreSnapshot;
      if (
        parsed.version !== PUBLIC_3DMARK_VERSION ||
        !Array.isArray(parsed.models) ||
        !Number.isFinite(Date.parse(parsed.checkedAt)) ||
        !Number.isFinite(Date.parse(parsed.updatedAt))
      )
        return;
      const keys = new Set<string>();
      for (const model of parsed.models) {
        if (
          !TESTS.includes(model.benchmark as PublicBenchmark) ||
          !gpuIdentity(model.model) ||
          !Number.isFinite(model.score) ||
          model.score <= 0 ||
          model.score > 1_000_000 ||
          (model.benchmark === "portRoyal"
            ? !Number.isInteger(model.samples) ||
              (model.samples ?? 0) < 1 ||
              (model.samples ?? 0) > 1_000_000
            : model.samples !== null)
        )
          return;
        const key = `${model.benchmark}:${gpuModelKey(model.model)}`;
        if (keys.has(key)) return;
        keys.add(key);
      }
      for (const benchmark of TESTS) {
        const rows = parsed.models.filter(
          (model) => model.benchmark === benchmark,
        );
        const source = parsed.sources?.[benchmark];
        if (rows.length === 0) continue;
        if (
          rows.length < 40 ||
          source?.source !== PUBLIC_3DMARK_SOURCES[benchmark].source ||
          source.methodology !== PUBLIC_3DMARK_SOURCES[benchmark].methodology ||
          !Number.isFinite(Date.parse(source.checkedAt)) ||
          !Number.isFinite(Date.parse(source.updatedAt))
        )
          return;
      }
      if (!parsed.models.length) return;
      // An older runtime cache must not hide newly bundled benchmark projects.
      const previous = this.snapshot;
      if (!previous) this.snapshot = parsed;
      else {
        const sources = { ...previous.sources };
        let models = [...previous.models];
        for (const benchmark of TESTS) {
          const next = parsed.sources?.[benchmark];
          if (
            !next ||
            (sources[benchmark] &&
              Date.parse(sources[benchmark]!.checkedAt) >
                Date.parse(next.checkedAt))
          )
            continue;
          sources[benchmark] = next;
          models = [
            ...models.filter((model) => model.benchmark !== benchmark),
            ...parsed.models.filter((model) => model.benchmark === benchmark),
          ];
        }
        this.snapshot = { ...parsed, models, sources };
      }
    } catch {
      /* A missing cache must not replace the bundled, verified reference. */
    }
  }
  private async fetchAndStore() {
    const sources = { ...this.snapshot?.sources };
    let models = [...(this.snapshot?.models ?? [])];
    let successfulCheck = this.snapshot?.checkedAt ?? new Date().toISOString();
    let changed = false;
    for (const benchmark of TESTS) {
      const spec = PUBLIC_3DMARK_SOURCES[benchmark];
      try {
        const response = await this.fetcher(spec.source, {
          headers: {
            Accept: "text/html",
            "User-Agent":
              "ChengduGPUWebsite/1.0 (+https://cdgpu.cn; benchmark reference sync)",
          },
          signal: AbortSignal.timeout(20_000),
          redirect: "error",
        });
        if (!response.ok) throw new Error(`源站返回 HTTP ${response.status}`);
        if (Number(response.headers.get("content-length")) > MAX_BYTES)
          throw new Error("源站页面超过大小限制");
        const parsed = parsePublicThreeDMarkHtml(
          await response.text(),
          benchmark,
        );
        const previous = models.filter(
          (model) => model.benchmark === benchmark,
        );
        if (
          previous.length >= 40 &&
          parsed.models.length < previous.length * 0.7
        )
          throw new Error("源站成绩数量异常减少，保留完整快照");
        const modelChanged =
          JSON.stringify(previous) !== JSON.stringify(parsed.models);
        const now = new Date().toISOString();
        changed ||= modelChanged;
        successfulCheck = now;
        models = [
          ...models.filter((model) => model.benchmark !== benchmark),
          ...parsed.models,
        ];
        sources[benchmark] = {
          ...spec,
          sourceUpdatedAt: parsed.sourceUpdatedAt,
          checkedAt: now,
          updatedAt: modelChanged
            ? now
            : (sources[benchmark]?.updatedAt ?? now),
          refreshFailed: false,
        };
        delete this.failures[benchmark];
      } catch (error) {
        const reason = error instanceof Error ? error.message : "源站暂不可用";
        this.failures[benchmark] = reason;
        if (sources[benchmark])
          sources[benchmark] = {
            ...sources[benchmark],
            refreshFailed: true,
            reason,
          } as GpuRankingBenchmarkSource;
        console.warn(
          `Public 3DMark ${benchmark} sync failed; retaining verified data: ${reason}`,
        );
      }
    }
    if (!models.length) return this.snapshot;
    this.snapshot = {
      source: PUBLIC_3DMARK_SOURCES.steelNomad.source,
      version: PUBLIC_3DMARK_VERSION,
      sourceUpdatedAt: null,
      checkedAt: successfulCheck,
      updatedAt: changed
        ? new Date().toISOString()
        : (this.snapshot?.updatedAt ?? successfulCheck),
      models,
      sources,
    };
    try {
      await mkdir(path.dirname(this.options.cacheFile), { recursive: true });
      const temp = `${this.options.cacheFile}.${process.pid}.tmp`;
      await writeFile(temp, JSON.stringify(this.snapshot), { mode: 0o600 });
      await rename(temp, this.options.cacheFile);
    } catch (error) {
      console.warn(
        "Public 3DMark cache write failed:",
        error instanceof Error ? error.message : "unknown error",
      );
    }
    return this.snapshot;
  }
}
