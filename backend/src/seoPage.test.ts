import assert from "node:assert/strict";
import { load } from "cheerio";
import test from "node:test";
import { renderGpuRankingSeoHtml, renderSearchablePageSeoHtml, SEARCHABLE_SEO_PAGE_PATHS } from "./seoPage.js";
import type { GpuRankingSnapshot } from "./gpuRankingService.js";
import { resolveSeoPage } from "@cdxkyhd/shared";
import { readFileSync } from "node:fs";

const appShell = `<!doctype html><html lang="zh-CN"><head><title>首页</title><script type="module" src="/assets/app.js"></script></head><body><div id="root"></div></body></html>`;

test("GPU ranking HTML contains crawlable metadata, content, and current 2K results", () => {
  const snapshot: GpuRankingSnapshot = {
    source: "https://www.tomshardware.com/reviews/gpu-hierarchy,4388.html",
    sourceUpdatedAt: "2026-06-24T21:35:42.000Z",
    checkedAt: "2026-10-16T07:00:43.656Z",
    updatedAt: "2026-06-24T21:35:42.000Z",
    models: [
      { model: "GeForce RTX 4070", raster: [{ relativeScore: 80, fps: 120 }, { relativeScore: 78, fps: 100 }, { relativeScore: 60, fps: 50 }], rayTracing: [{ relativeScore: 70, fps: 90 }, { relativeScore: 65, fps: 80 }, { relativeScore: 50, fps: 40 }] },
      { model: "GeForce RTX 5090", raster: [{ relativeScore: 100, fps: 200 }, { relativeScore: 100, fps: 180 }, { relativeScore: 100, fps: 110 }], rayTracing: [{ relativeScore: 100, fps: 140 }, { relativeScore: 100, fps: 120 }, { relativeScore: 100, fps: 80 }] },
    ],
  };

  const $ = load(renderGpuRankingSeoHtml(appShell, snapshot));
  assert.equal($("title").text(), "显卡天梯图与性能排行：游戏 FPS、跑分对比 - 成都显卡一号店");
  assert.match($('meta[name="description"]').attr("content") ?? "", /游戏 FPS/);
  assert.equal($('link[rel="canonical"]').attr("href"), "https://cdgpu.cn/gpu-ranking");
  assert.equal($('meta[property="og:url"]').attr("content"), "https://cdgpu.cn/gpu-ranking");
  assert.equal($("#root h1").text(), "显卡性能天梯");
  assert.deepEqual($("#root tbody tr th").map((_, node) => $(node).text()).get(), ["GeForce RTX 5090", "GeForce RTX 4070"]);
  assert.equal($("#root tbody tr").first().find("td").first().text(), "180.0 FPS");
  assert.equal($("script[type='module']").attr("src"), "/assets/app.js");
  const schema = JSON.parse($('script[data-seo-page="gpu-ranking"]').text()) as { url: string; name: string };
  assert.equal(schema.url, "https://cdgpu.cn/gpu-ranking");
  assert.equal(schema.name, "显卡天梯图与性能排行：游戏 FPS、跑分对比 - 成都显卡一号店");
});

test("GPU ranking SEO page remains useful while scores are unavailable", () => {
  const $ = load(renderGpuRankingSeoHtml(appShell, null));
  assert.equal($("#root h1").text(), "显卡性能天梯");
  assert.match($("#root").text(), /成绩正在同步/);
  assert.equal($("#root tbody tr").length, 0);
});

test("searchable tool pages expose unique metadata, canonical URLs, and readable page content", () => {
  const canonicalPaths = SEARCHABLE_SEO_PAGE_PATHS.filter((pathname) => pathname !== "/gpu-sn");
  const canonicalUrls = new Set<string>();
  const pageTitles = new Set<string>();
  const descriptions = new Set<string>();

  for (const pathname of canonicalPaths) {
    const $ = load(renderSearchablePageSeoHtml(appShell, pathname));
    const canonical = $('link[rel="canonical"]').attr("href") ?? "";
    const description = $('meta[name="description"]').attr("content") ?? "";

    assert.match($("title").text(), /成都显卡一号店/);
    assert.ok($("#root h1").text().length > 0, `${pathname} should include a heading`);
    assert.ok(description.length > 40, `${pathname} should include a useful description`);
    assert.equal($('meta[name="robots"]').attr("content"), "index,follow");
    assert.equal(canonical, `https://cdgpu.cn${pathname}`);
    assert.ok($("#root").text().length > 100, `${pathname} should include crawlable explanatory content`);
    assert.equal(canonicalUrls.has(canonical), false, `${canonical} should be unique`);
    assert.equal(pageTitles.has($("title").text()), false, `${pathname} needs a distinct title`);
    assert.equal(descriptions.has(description), false, `${pathname} needs a distinct description`);
    const questions = resolveSeoPage(pathname)!.questions;
    assert.deepEqual($("#root details summary").map((_, node) => $(node).text()).get(), questions.map((item) => item.question));
    assert.deepEqual($("#root details p").map((_, node) => $(node).text()).get(), questions.map((item) => item.answer));
    canonicalUrls.add(canonical);
    pageTitles.add($("title").text());
    descriptions.add(description);
  }

  const tools = load(renderSearchablePageSeoHtml(appShell, "/tools"));
  assert.deepEqual(
    tools('#root a[href^="/tools/"]').map((_, link) => tools(link).attr("href")).get(),
    ["/tools/hashrate-rental", "/tools/prl-mining", "/tools/keyboard", "/tools/mouse", "/tools/audio", "/tools/monitor"],
  );
});

test("GPU SN alias and trailing slash keep the canonical URL stable", () => {
  const alias = load(renderSearchablePageSeoHtml(appShell, "/gpu-sn"));
  const trailingSlash = load(renderSearchablePageSeoHtml(appShell, "/tools/keyboard/"));

  assert.equal(alias('link[rel="canonical"]').attr("href"), "https://cdgpu.cn/gpu-sn.php");
  assert.equal(trailingSlash('link[rel="canonical"]').attr("href"), "https://cdgpu.cn/tools/keyboard");
  assert.equal(resolveSeoPage("/gpu-sn"), resolveSeoPage("/gpu-sn.php"));
  assert.equal(resolveSeoPage("/tools/keyboard/"), resolveSeoPage("/tools/keyboard"));
  assert.equal(resolveSeoPage("/unknown-page"), null);
});

test("homepage provides crawlable service links and every sitemap page has relevant SEO content", () => {
  const home = load(renderSearchablePageSeoHtml(appShell, "/"));
  assert.equal(home('#root h1').text(), "成都显卡一号店");
  assert.equal(home('link[rel="canonical"]').attr("href"), "https://cdgpu.cn/");
  for (const path of ["/build", "/gpu-ranking", "/gpu-sn.php", "/tools", "/#pricing", "/#inventory"]) {
    assert.ok(home(`#root a[href="${path}"]`).length > 0, `homepage should link to ${path}`);
  }

  const sitemap = load(readFileSync(new URL("../../frontend/public/sitemap.xml", import.meta.url), "utf8"), { xmlMode: true });
  for (const node of sitemap("loc").toArray()) {
    const pathname = new URL(sitemap(node).text()).pathname;
    assert.ok(resolveSeoPage(pathname), `${pathname} should have SEO content`);
    const html = pathname === "/gpu-ranking"
      ? renderGpuRankingSeoHtml(appShell, null)
      : renderSearchablePageSeoHtml(appShell, pathname);
    const page = load(html);
    assert.equal(page('meta[name="description"]').length, 1);
    assert.equal(page('link[rel="canonical"]').length, 1);
    assert.ok(page('#root details').length >= 2);
  }
});
