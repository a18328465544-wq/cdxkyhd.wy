import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import PriceSection from "./PriceSection";
import InventorySection from "./InventorySection";

test("price loading reserves eight rows and never substitutes static quotes", () => {
  const html = renderToStaticMarkup(<PriceSection onOpenContact={() => {}} onEstimate={() => {}} />);
  assert.match(html, /aria-busy="true"/);
  assert.equal((html.match(/<tr aria-hidden="true"/g) ?? []).length, 8);
  assert.doesNotMatch(html, /28xxx|82xx|¥47,000/);
});

test("inventory loading reserves a full page of cards without inventing inventory", () => {
  const html = renderToStaticMarkup(<InventorySection onOpenContact={() => {}} />);
  assert.match(html, /正在读取门店库存/);
  assert.equal((html.match(/h-\[302px\]/g) ?? []).length, 9);
  assert.doesNotMatch(html, /已入库|已上架/);
});
