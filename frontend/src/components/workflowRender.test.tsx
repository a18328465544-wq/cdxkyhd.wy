import assert from "node:assert/strict";
import test from "node:test";
import { act, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { JSDOM } from "jsdom";
import PcBuilderSection from "./PcBuilderSection";
import ToolCenterPage from "./tools/ToolCenterPage";
import AiWorkstationSection from "./AiWorkstationSection";
import GpuRankingPage from "./GpuRankingPage";

async function withDom(ui: ReactNode, fetcher: typeof fetch, run: (document: Document, settle: () => Promise<void>) => Promise<void>) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: "http://localhost/", pretendToBeVisual: true });
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  const originals = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, HTMLDetailsElement: dom.window.HTMLDetailsElement, Element: dom.window.Element, fetch: fetcher, IS_REACT_ACT_ENVIRONMENT: true })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(dom.window.document.getElementById("root")!);
  const settle = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 200)); }); };
  try {
    await act(async () => root.render(ui));
    await settle();
    await run(dom.window.document, settle);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}

test("tools are grouped by customer task, with real routes and a single SN entry", () => {
  const dom = new JSDOM(renderToStaticMarkup(<MemoryRouter><ToolCenterPage /></MemoryRouter>));
  const sections = [...dom.window.document.querySelectorAll("main > section")];
  assert.deepEqual(sections.map(section => section.getAttribute("aria-label")), ["选购与对比", "查询与检测", "成本计算"]);
  assert.deepEqual([...sections[0].querySelectorAll("a")].map(link => link.getAttribute("href")), ["/build", "/gpu-ranking", "/gpu-daily"]);
  assert.equal(dom.window.document.querySelectorAll('a[href="/gpu-sn.php"]').length, 1);
  assert.equal(dom.window.document.querySelectorAll("main a").length, 10);
  assert.equal(sections[2].querySelectorAll("a").length, 2);
  dom.window.close();
});

test("workstation copy states workload limits without speed or stability guarantees", () => {
  const html = renderToStaticMarkup(<AiWorkstationSection onOpenContact={() => {}} />);
  assert.doesNotMatch(html, /完美运行|完美适配|秒级|无死机|开机即可使用/);
  assert.match(html, /多卡显存不自动合并/);
  assert.match(html, /上下文长度/);
});

test("builder starter selection recalculates, requires replacement confirmation, and resets", async () => {
  const parts = [
    { id: "cpu-game", name: "Intel 14600KF", category: "CPU", price: 1000, quantity: 1, condition: "95新", specs: "" },
    { id: "cpu-work", name: "Intel I9-14900KF", category: "CPU", price: 2000, quantity: 1, condition: "全新", specs: "" },
    { id: "gpu-game", name: "RTX5060 8G", category: "GPU", price: 2000, quantity: 1, condition: "全新", specs: "" },
    { id: "gpu-work", name: "RTX4080 SUPER 16G", category: "GPU", price: 7000, quantity: 1, condition: "95新", specs: "" },
  ];
  const builds: Record<string, string>[] = [];
  const fetcher: typeof fetch = async (input, options) => {
    if (String(input).includes("/api/pc-parts")) return Response.json({ success: true, parts });
    assert(String(input).includes("/api/pc-builder/build"), "no quote is submitted during preview");
    const selection = JSON.parse(String(options?.body));
    builds.push(selection);
    return Response.json({ success: true, totalPrice: selection.cpuId === "cpu-game" ? 3000 : 9000, totalWattageNeed: 0, safetyWattageRecommended: 0, warnings: [], successes: [], aiRating: "", aiRatingDesc: "" });
  };
  await withDom(<PcBuilderSection />, fetcher, async (document, settle) => {
    const button = (text: string) => [...document.querySelectorAll("button")].find(button => button.textContent?.trim() === text)!;
    await act(async () => button("使用起步配置").click());
    await settle();
    assert.equal(builds.at(-1)?.cpuId, "cpu-game");
    assert.equal(builds.at(-1)?.gpuId, "gpu-game");
    assert.match(document.body.textContent ?? "", /已选 2 \/ 8 项/);
    assert.match(document.body.textContent ?? "", /非完整整机/);
    await act(async () => button("生产力").click());
    await act(async () => button("使用起步配置").click());
    assert(document.querySelector('[aria-label="确认替换核心配件"]'));
    assert.equal(builds.at(-1)?.cpuId, "cpu-game");
    await act(async () => button("取消").click());
    assert.equal(document.querySelector('[aria-label="确认替换核心配件"]'), null);
    await act(async () => button("使用起步配置").click());
    await act(async () => button("确认替换").click());
    await settle();
    assert.equal(builds.at(-1)?.cpuId, "cpu-work");
    assert.equal(builds.at(-1)?.gpuId, "gpu-work");
    await act(async () => button("重置").click());
    assert.match(document.body.textContent ?? "", /已选 0 \/ 8 项/);
  });
});

test("unavailable starter is disabled and catalog failures provide retry", async () => {
  await withDom(<PcBuilderSection />, async () => Response.json({ success: true, parts: [] }), async document => {
    const apply = [...document.querySelectorAll("button")].find(button => button.textContent?.includes("使用起步配置"))!;
    assert(apply.disabled);
    assert.match(document.body.textContent ?? "", /暂无匹配现货/);
  });
  await withDom(<PcBuilderSection />, async () => { throw new Error("offline"); }, async document => {
    assert(document.querySelector('[role="alert"]'));
    assert.match(document.body.textContent ?? "", /重新读取配件/);
  });
});

test("ranking uses row checkboxes, preserves comparison limit, and exposes source near filters", async () => {
  const models = ["GeForce RTX 5090", "GeForce RTX 4090", "GeForce RTX 5080", "GeForce RTX 4080", "GeForce RTX 3090"].map((model, index) => ({ model, raster: Array(3).fill({ fps: 100 - index, relativeScore: 100 - index }), rayTracing: Array(3).fill(null) }));
  const fetcher: typeof fetch = async input => Response.json(String(input).includes("gpu-ranking")
    ? { success: true, snapshot: { source: "https://example.com", sourceUpdatedAt: "2026-11-01T00:00:00Z", checkedAt: "2026-11-06T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z", models }, blenderSnapshot: null, geekbenchSnapshot: null, threeDMarkSnapshot: null }
    : { success: true, items: [] });
  await withDom(<GpuRankingPage onOpenContact={() => {}} />, fetcher, async (document, settle) => {
    const checkboxes = [...document.querySelectorAll<HTMLInputElement>('.ranking-row input[type="checkbox"]')];
    assert.equal(checkboxes.length, 5);
    assert(document.querySelector('[aria-label="天梯筛选"] .ranking-source-info'));
    assert.match(document.querySelector(".ranking-source-info")!.textContent ?? "", /源站更新.*本站数据更新.*最近成功检查/s);
    const methodology = [...document.querySelectorAll("button")].find(button => button.textContent === "完整测试口径")!;
    await act(async () => methodology.click());
    assert.equal(document.querySelector<HTMLDetailsElement>("#ranking-source-methodology")!.open, true);
    for (const checkbox of checkboxes.slice(0, 4)) { await act(async () => checkbox.click()); await settle(); }
    assert(checkboxes[4].disabled);
    assert(document.querySelector('[aria-label="显卡对比"]'));
    await act(async () => checkboxes[0].click());
    assert.equal(checkboxes[4].disabled, false);
    const filter = document.querySelector<HTMLButtonElement>('button[aria-label="更多筛选"]')!;
    assert.equal(filter.getAttribute("aria-expanded"), "false");
    await act(async () => filter.click());
    assert.equal(filter.getAttribute("aria-expanded"), "true");
  });
});
