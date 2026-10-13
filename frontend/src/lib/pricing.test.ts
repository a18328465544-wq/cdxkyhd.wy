import assert from "node:assert/strict";
import { test } from "node:test";
import { estimatePayout, formatYuan, parseBasePrice } from "./pricing";

test("masked quotes are parsed as floors, not truncated", () => {
  assert.deepEqual(parseBasePrice("82xx"), { value: 8200, isFloor: true });
  assert.deepEqual(parseBasePrice("28xxx"), { value: 28000, isFloor: true });
  assert.deepEqual(parseBasePrice("24500"), { value: 24500, isFloor: false });
  assert.deepEqual(parseBasePrice("24,500"), { value: 24500, isFloor: false });
  assert.equal(parseBasePrice("微信详询"), null);
});

test("formatYuan groups thousands", () => {
  assert.equal(formatYuan(8200), "¥8,200");
});

test("estimatePayout applies condition and brand, rounded to 50", () => {
  const gpu = { name: "RTX 4090", category: "both" as const, basePrice: "18xxx", trend: "stable" as const, specs: { vram: "24GB", tdp: "450W" } };
  assert.equal(estimatePayout(gpu, "perfect", "mid"), 18100);
  assert.equal(estimatePayout(gpu, "poor", "basic"), Math.round((18000 * 0.78 - 150) / 50) * 50);
  assert.equal(estimatePayout(undefined, "perfect", "mid"), null);
});
