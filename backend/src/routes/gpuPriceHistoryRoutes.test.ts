import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import express from "express";
import { emptyDailyGpuPrices, historicalGpuPriceSnapshot, type GpuPriceHistory } from "@cdxkyhd/shared";
import { GpuPriceHistoryService } from "../services/gpuPriceHistoryService.js";
import { registerGpuPriceHistoryRoutes } from "./gpuPriceHistoryRoutes.js";
import { registerGpuDailyRoutes } from "./gpuDailyRoutes.js";

const now = Date.parse("2026-10-29T12:00:00+08:00");
function fixture(date = "2026-10-29", cents = 700000) {
  const generated = Date.parse(`${date}T11:00:00+08:00`);
  const data = emptyDailyGpuPrices("ready", generated);
  data.generated_at = new Date(generated).toISOString();
  const offer = { platform: "pdd" as const, platform_name: "拼多多", merchant: "TEST 合成商家（非真实报价）", title: "TEST 全新 RTX 5070 Ti 16GB", price_cents: cents,
    currency: "CNY" as const, url: "https://mobile.yangkeduo.com/goods.html?goods_id=123", observed_at: `${date}T10:00:00+08:00`, conditions: ["满100减5优惠券"], terms: "TEST" };
  data.rows[5] = { ...data.rows[5], status: "available", offers: [offer], lowest: offer };
  return data;
}

test("historical quotes remain historical after midnight; pending, wrong SKUs and bad URLs are not history", () => {
  assert.equal(historicalGpuPriceSnapshot(fixture("2026-10-27"), now)?.available_models, 1);
  for (const mutate of [
    (value: ReturnType<typeof fixture>) => { value.rows[5].offers[0].url += "&token=PRIVATE"; },
    (value: ReturnType<typeof fixture>) => { value.rows[5].memory_gb = 8; },
    (value: ReturnType<typeof fixture>) => { value.rows[5].offers[0].price_cents = 0; },
    (value: ReturnType<typeof fixture>) => { value.rows[5].offers[0].observed_at = "2026-10-30T10:00:00+08:00"; },
  ]) { const value = fixture(); mutate(value); assert.equal(historicalGpuPriceSnapshot(value, now), null); }
  const pending = fixture(); pending.rows[5].status = "awaiting_review";
  assert.equal(historicalGpuPriceSnapshot(pending, now)?.rows[5].offers.length, 0);
  assert.equal(historicalGpuPriceSnapshot(fixture("2026-10-30"), now), null);
});

test("archives public-only daily snapshots, preserves gaps, replaces a day and survives restart", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "gpu-price-history-"));
  const feedFile = path.join(directory, "prices.json"); const archiveFile = path.join(directory, "history.json");
  try {
    let service = await GpuPriceHistoryService.open({ feedFile, archiveFile, clock: () => now });
    const first = { ...fixture("2026-10-27", 720000), token: "PRIVATE", notes: "PRIVATE", watch_id: "PRIVATE" };
    await writeFile(feedFile, JSON.stringify(first));
    await Promise.all(Array.from({ length: 8 }, () => service.refresh(true)));
    await writeFile(feedFile, JSON.stringify(fixture("2026-10-29", 700000))); await service.refresh(true);
    let data = service.history("5070ti", 7);
    assert.equal(data.series.length, 7); assert.equal(data.series[0].date, "2026-10-23");
    assert.equal(data.series[4].offers[0].price_cents, 720000);
    assert.deepEqual(data.series[5].offers, []); assert.equal(data.series[6].offers[0].price_cents, 700000);
    assert.ok(!JSON.stringify(data).includes("PRIVATE"));
    assert.ok(!(await readFile(archiveFile, "utf8")).includes("PRIVATE"));
    const replacement = fixture("2026-10-29", 710000); replacement.generated_at = "2026-10-29T11:10:00+08:00";
    await writeFile(feedFile, JSON.stringify(replacement)); await service.refresh(true);
    assert.equal(service.history("5070ti", 7).series[6].offers[0].price_cents, 710000, "the last verified sample replaces the day's value, not an intraday low");
    await writeFile(feedFile, JSON.stringify(fixture("2026-10-29", 600000))); await service.refresh(true);
    assert.equal(service.history("5070ti", 7).series[6].offers[0].price_cents, 710000, "older publications cannot replace a newer sample");
    service = await GpuPriceHistoryService.open({ feedFile, archiveFile, clock: () => now });
    data = service.history("5070ti", 7); assert.equal(data.series[6].offers[0].price_cents, 710000);
    const revoked = fixture(); revoked.generated_at = "2026-10-29T11:30:00+08:00"; revoked.rows[5].status = "awaiting_review";
    await writeFile(feedFile, JSON.stringify(revoked)); await service.refresh(true);
    assert.deepEqual(service.history("5070ti", 7).series[6].offers, [], "withdrawn approval removes that day's public sample");
    await writeFile(feedFile, "broken json"); await service.refresh(true);
    assert.equal(service.history("5070ti", 7).source_status, "invalid");
    assert.equal(service.history("5070ti", 7).series[4].offers[0].price_cents, 720000);
    assert.ok((await readdir(directory)).every(file => !file.endsWith(".tmp")));
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("HTTP history rejects unbounded query input and never substitutes fake or pending prices", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "gpu-history-http-"));
  const feedFile = path.join(directory, "prices.json"); const archiveFile = path.join(directory, "history.json");
  const service = await GpuPriceHistoryService.open({ feedFile, archiveFile, clock: () => now });
  const app = express(); registerGpuDailyRoutes(app, feedFile); registerGpuPriceHistoryRoutes(app, service);
  const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/gpu-daily/history`;
  try {
    const response = await fetch(`${url}?model=5070ti&days=30`);
    assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "no-store");
    const data = await response.json() as GpuPriceHistory;
    assert.equal(data.model.label, "RTX 5070 Ti 16GB"); assert.equal(data.series.length, 30);
    assert.ok(data.series.every(day => !day.offers.length));
    for (const query of ["", "model=unknown", "model=5070ti&days=999999", "model=5070ti&days=0", "model=5070ti&days=7.0", "model=5070ti&days=7&days=30", "model[a]=5070ti", "model=5070ti&days[x]=7"]) {
      assert.equal((await fetch(`${url}?${query}`)).status, 400, query);
    }
    await writeFile(feedFile, JSON.stringify({ ...fixture(), generated_at: new Date(now).toISOString(), rows: [] }));
    await service.refresh(true);
    assert.ok(service.history("5070ti", 90).series.every(day => !day.offers.length));
    assert.ok(!(await (await fetch(`${url}?model=5070ti&days=7`)).text()).includes(directory));
  } finally {
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});

test("a corrupt archive is preserved and fails only history, not the daily page API", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "gpu-history-corrupt-"));
  const feedFile = path.join(directory, "prices.json"); const archiveFile = path.join(directory, "history.json");
  await writeFile(archiveFile, "do not overwrite"); await writeFile(feedFile, JSON.stringify(fixture()));
  const service = await GpuPriceHistoryService.open({ feedFile, archiveFile, clock: () => now });
  await service.refresh(true);
  assert.throws(() => service.history("5070ti", 30), /归档暂不可用/);
  assert.equal(await readFile(archiveFile, "utf8"), "do not overwrite");
  const app = express(); registerGpuDailyRoutes(app, feedFile); registerGpuPriceHistoryRoutes(app, service);
  const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    assert.equal((await fetch(`${base}/api/gpu-daily/history?model=5070ti&days=30`)).status, 503);
    assert.equal((await fetch(`${base}/api/gpu-daily`)).status, 200);
  } finally {
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});
