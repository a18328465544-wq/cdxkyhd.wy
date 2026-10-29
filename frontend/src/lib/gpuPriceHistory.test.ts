import assert from "node:assert/strict";
import test from "node:test";
import { buildGpuPriceHistory, emptyDailyGpuPrices } from "@cdxkyhd/shared";
import { priceHistoryLabelPositions, priceHistoryLastOffer, priceHistoryLines, priceHistoryMoney, priceHistoryPointRadius, priceHistorySummary, priceHistoryTickIndices } from "./gpuPriceHistory";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import GpuPriceHistorySection, { GpuPriceHistoryPlaceholder, GpuPriceHistorySummary } from "../components/GpuPriceHistorySection";

const now = Date.parse("2026-10-29T12:00:00+08:00");
test("price chart retains calendar gaps, exact cents, per-platform data and unavailable states", () => {
  const data = buildGpuPriceHistory([], "5060ti16", 7, now);
  assert.equal(data.model.memory_gb, 16); assert.equal(data.series.length, 7);
  assert.deepEqual(priceHistoryLines(data, ["pdd"])[0].prices, [null, null, null, null, null, null, null]);
  assert.equal(priceHistorySummary(data, ["pdd"]).minCents, null); assert.equal(priceHistoryMoney(null), "—");
  const offer = { platform: "pdd" as const, platform_name: "拼多多", merchant: "TEST 非真实报价", title: "TEST", price_cents: 432199, currency: "CNY" as const,
    url: "https://mobile.yangkeduo.com/goods.html?goods_id=123", observed_at: "2026-10-29T10:00:00+08:00", conditions: [], terms: "TEST" };
  data.series[1].offers = [offer]; data.series[5].offers = [{ ...offer, price_cents: 400000 }];
  data.series[6].offers = [{ ...offer, platform: "taobao", price_cents: 440000 }];
  assert.deepEqual(priceHistoryLines(data, ["pdd"])[0].prices, [null, 4321.99, null, null, null, 4000, null]);
  assert.deepEqual(priceHistorySummary(data, ["pdd"]), { recordedDays: 2, latestDay: "2026-10-28", latestCents: 400000, minCents: 400000, maxCents: 432199 });
  assert.equal(priceHistorySummary(data, ["taobao"]).recordedDays, 1);
  assert.equal(priceHistorySummary(data, []).recordedDays, 0);
  assert.equal(priceHistoryMoney(432199), "¥4,321.99");
  assert.equal(priceHistoryMoney(432140), "¥4,321.40");
  assert.equal(priceHistoryMoney(400000), "¥4,000");
  assert.equal(priceHistoryLastOffer(data, "pdd")?.date, "2026-10-28");
  assert.equal(priceHistoryLastOffer(data, "taobao")?.date, "2026-10-29");
});

test("Beijing midnight creates a new blank day instead of carrying forward yesterday", () => {
  const data = emptyDailyGpuPrices("ready", now);
  const history = buildGpuPriceHistory([data], "5070ti", 7, Date.parse("2026-10-30T00:00:00+08:00"));
  assert.equal(history.series.at(-1)?.date, "2026-10-30");
  assert.deepEqual(history.series.at(-1)?.offers, []);
});

test("history reserves chart space and exposes model, period, platform and detail controls without demo prices", () => {
  const html = renderToStaticMarkup(createElement(GpuPriceHistorySection, { model: "5060ti16", onModelChange: () => {} }));
  for (const label of ["全新售价走势", "RTX 5060 Ti 16GB", "近 7 天", "近 30 天", "近 90 天", "拼多多", "淘宝 / 天猫", "查看历史明细", "刷新历史报价"]) assert.ok(html.includes(label), label);
  assert.ok(html.includes('aria-busy="true"'));
  assert.ok(html.includes("h-[320px]"));
  assert.ok(!html.includes("<canvas"));
  assert.ok(!/¥[\d,]/.test(html));
});

test("compact empty states contain neither a fake chart nor three empty statistics; the quote date stays explicit", () => {
  const summary = priceHistorySummary(null, ["pdd"]);
  assert.equal(renderToStaticMarkup(createElement(GpuPriceHistorySummary, { summary })), "");
  const empty = renderToStaticMarkup(createElement(GpuPriceHistoryPlaceholder, { state: "empty", message: "TEST 暂无已核对记录" }));
  assert.ok(empty.includes("暂无已核对的历史报价")); assert.ok(!empty.includes("<canvas"));
  const error = renderToStaticMarkup(createElement(GpuPriceHistoryPlaceholder, { state: "error", message: "请稍后刷新" }));
  assert.ok(error.includes('role="alert"')); assert.ok(!error.includes("暂无已核对的历史报价"));
  const populated = renderToStaticMarkup(createElement(GpuPriceHistorySummary, { summary: { recordedDays: 2, latestDay: "2026-10-28", latestCents: 432140, minCents: 420000, maxCents: 440000 } }));
  assert.ok(populated.includes("报价日期 2026-10-28")); assert.ok(!populated.includes("今日"));
  assert.ok(populated.includes("text-[32px]")); assert.ok(populated.includes("¥4,321.40"));
});

test("date ticks retain both ends; labels do not collide; isolated points and gap endpoints remain visible", () => {
  for (const length of [7, 30, 90]) {
    const ticks = priceHistoryTickIndices(length, 4);
    assert.equal(ticks[0], 0); assert.equal(ticks.at(-1), length - 1); assert.equal(new Set(ticks).size, 4);
  }
  assert.deepEqual(priceHistoryTickIndices(1, 4), [0]); assert.deepEqual(priceHistoryTickIndices(0, 4), []);
  const prices = [null, 10, 11, 12, null, 15, null, 16, 17];
  assert.deepEqual(prices.map((_value, index) => priceHistoryPointRadius(prices, index)), [0, 3, 0, 3, 0, 3, 0, 3, 3]);
  for (const ys of [[100, 100], [190, 195], [0, 1], [200, 0]]) {
    const positions = priceHistoryLabelPositions(ys, 24, 176);
    assert.ok(positions.every(position => position >= 24 && position <= 176));
    assert.ok(Math.abs(positions[1] - positions[0]) >= 52);
  }
});
