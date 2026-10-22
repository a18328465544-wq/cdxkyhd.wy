import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { once } from "node:events";
import express from "express";
import type { AddressInfo } from "node:net";
import { emptyDailyGpuPrices, normalizeDailyGpuPrices, type DailyGpuPrices } from "@cdxkyhd/shared";
import { registerGpuDailyRoutes } from "./gpuDailyRoutes.js";

const now = Date.parse("2026-10-21T12:00:00+08:00");
function fixture() {
  const data = emptyDailyGpuPrices("ready", now);
  data.generated_at = "2026-10-21T11:00:00+08:00";
  const offer = { platform: "pdd" as const, platform_name: "拼多多", merchant: "TEST 合成商家",
    title: "TEST 全新 RTX 5060 8GB 显卡", price_cents: 200000, currency: "CNY" as const,
    url: "https://mobile.yangkeduo.com/goods.html?goods_id=123", observed_at: "2026-10-21T10:00:00+08:00",
    conditions: ["满100减5优惠券"], terms: "TEST" };
  data.rows[1] = { ...data.rows[1], status: "available", lowest: offer, offers: [offer] };
  return data;
}

test("publishes allowlisted offers and recomputes minima, ignoring private fields", () => {
  const raw = fixture();
  const row = raw.rows[1];
  row.offers.push({ ...row.offers[0], price_cents: 250000 });
  const result = normalizeDailyGpuPrices({ ...raw, token: "PRIVATE", raw_text: "PRIVATE" }, now);
  assert.equal(result.available_models, 1);
  assert.equal(result.rows[1].lowest?.price_cents, 200000);
  assert.equal(result.rows[1].offers.length, 1);
  assert.ok(!JSON.stringify(result).includes("PRIVATE"));
  assert.equal(result.total_models, 10);
});

test("crossing Beijing midnight hides old prices on both server and browser", () => {
  const before = normalizeDailyGpuPrices(fixture(), now);
  assert.equal(before.rows[1].status, "available");
  const after = normalizeDailyGpuPrices(before, Date.parse("2026-10-22T00:00:00+08:00"));
  assert.equal(after.feed_status, "expired");
  assert.equal(normalizeDailyGpuPrices(after, Date.parse("2026-10-22T00:00:01+08:00")).feed_status, "expired");
  assert.equal(after.available_models, 0);
  assert.ok(after.rows.every(v => v.lowest === null && v.offers.length === 0));
});

test("pending, wrong memory, arbitrary links, account params, bad policy and future timestamps fail closed", () => {
  const mutations = [
    (v: ReturnType<typeof fixture>) => { v.rows[1].status = "awaiting_review"; },
    (v: ReturnType<typeof fixture>) => { v.rows[1].memory_gb = 16; },
    (v: ReturnType<typeof fixture>) => { v.rows[1].offers[0].url = "javascript:alert(1)"; },
    (v: ReturnType<typeof fixture>) => { v.rows[1].offers[0].url += "&token=PRIVATE"; },
    (v: ReturnType<typeof fixture>) => { v.rows[1].offers[0].observed_at = "2026-10-21T14:00:00+08:00"; },
    (v: ReturnType<typeof fixture>) => { v.rows[1].offers[0].price_cents = 0; },
  ];
  for (const mutate of mutations) {
    const raw = fixture(); mutate(raw);
    assert.equal(normalizeDailyGpuPrices(raw, now).available_models, 0);
  }
  assert.equal(normalizeDailyGpuPrices({ ...fixture(), publication_policy: "all" }, now).available_models, 0);
});

test("public HTTP route reads a refreshed file, strips internal data and tolerates missing or broken files", async () => {
  const folder = await mkdtemp(path.join(tmpdir(), "gpu-daily-test-"));
  const file = path.join(folder, "prices.json");
  const app = express(); registerGpuDailyRoutes(app, file);
  const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/gpu-daily`;
  const get = async () => await (await fetch(url)).json() as DailyGpuPrices;
  try {
    assert.equal((await get()).feed_status, "unavailable");
    const today = emptyDailyGpuPrices("ready"); today.generated_at = new Date(Date.now() - 1000).toISOString();
    await writeFile(file, JSON.stringify({ ...today, token: "PRIVATE" }));
    const response = await fetch(url);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal((await response.json() as DailyGpuPrices).feed_status, "ready");
    await writeFile(file, "broken json");
    assert.equal((await get()).available_models, 0);
    assert.ok(!(await (await fetch(url)).text()).includes(folder));
  } finally {
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
    await rm(folder, { recursive: true, force: true });
  }
});
