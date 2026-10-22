import assert from "node:assert/strict";
import test from "node:test";
import { PrlMarketService } from "./prlMarketService.js";

const payload = (now: number) => ({ "pearl-2": { cny: 2, usd: 0.28, last_updated_at: now / 1000, cny_24h_change: -3 } });

test("PRL requests share one in-flight quote and the cache window", async t => {
  const now = Date.parse("2026-10-22T06:00:00Z");
  t.mock.method(Date, "now", () => now);
  let calls = 0;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  t.mock.method(globalThis, "fetch", async (_url: unknown, options: RequestInit) => {
    calls++;
    assert.equal((options.headers as Record<string, string>)["x-cg-demo-api-key"], "test-only-key");
    await gate;
    return Response.json(payload(now));
  });
  const market = new PrlMarketService("test-only-key");
  const first = market.getPrice();
  const second = market.getPrice();
  release();
  const results = await Promise.all([first, second, market.getPrice()]);
  assert.equal(calls, 1);
  assert.ok(results.every(result => result.status === "fresh" && result.quote?.cny === 2));
  assert.ok(!JSON.stringify(results).includes("test-only-key"));
});

test("PRL upstream failure retains a stale quote without calling it fresh", async t => {
  let now = Date.parse("2026-10-22T06:00:00Z");
  t.mock.method(Date, "now", () => now);
  let fail = false;
  t.mock.method(globalThis, "fetch", async () => fail ? new Response("limited", { status: 429 }) : Response.json(payload(now)));
  const market = new PrlMarketService();
  assert.equal((await market.getPrice()).status, "fresh");
  now += 61_000;
  fail = true;
  const stale = await market.getPrice();
  assert.equal(stale.status, "stale");
  assert.equal(stale.quote?.cny, 2);
  assert.match(stale.message!, /受限/);
  now += 24 * 60 * 60_000;
  const expired = await market.getPrice();
  assert.equal(expired.status, "unavailable");
  assert.equal(expired.quote, null);
});

test("PRL rejects invalid prices and source dates instead of inventing a quote", async t => {
  const now = Date.parse("2026-10-22T06:00:00Z");
  t.mock.method(Date, "now", () => now);
  let body: unknown;
  t.mock.method(globalThis, "fetch", async () => Response.json(body));
  for (const value of [
    {},
    { "pearl-2": { ...payload(now)["pearl-2"], cny: 0 } },
    { "pearl-2": { ...payload(now)["pearl-2"], usd: "0.28" } },
    payload(now + 121_000),
    payload(now - 25 * 60 * 60_000),
  ]) {
    body = value;
    const result = await new PrlMarketService().getPrice();
    assert.equal(result.success, false);
    assert.equal(result.status, "unavailable");
    assert.equal(result.quote, null);
  }
});

test("PRL older-than-fifteen-minute quotes are never marked fresh", async t => {
  const now = Date.parse("2026-10-22T06:00:00Z");
  t.mock.method(Date, "now", () => now);
  t.mock.method(globalThis, "fetch", async () => Response.json(payload(now - 16 * 60_000)));
  const result = await new PrlMarketService().getPrice();
  assert.equal(result.status, "stale");
  assert.match(result.message!, /停止自动/);
});
