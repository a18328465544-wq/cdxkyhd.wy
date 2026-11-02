import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act } from "react";
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

test("inventory keeps details, inquiry and pagination but never displays ERP prices", async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: "http://localhost/" });
  const win = dom.window;
  const originals = new Map<string, PropertyDescriptor | undefined>();
  const requests: string[] = [];
  let inquiries = 0;
  const item = { id: "test-gpu-1", name: "TEST RTX 5070", category: "GPU", categoryLabel: "显卡", price: 123456, quantity: 1, condition: "九成新", fullBox: true, inWarranty: true, repaired: false, status: "已上架", specs: "测试规格", warehouseLocation: "测试库位" };
  const mockFetch = async (input: string | URL | Request) => {
    const url = new URL(String(input), win.location.href);
    requests.push(url.search);
    const page = Number(url.searchParams.get("page") || 1);
    return new Response(JSON.stringify({ success: true, categories: [{ key: "GPU", label: "显卡" }], items: [{ ...item, id: page === 2 ? "test-gpu-2" : item.id }], totalCount: 10, page, totalPages: 2 }), { headers: { "Content-Type": "application/json" } });
  };
  for (const [key, value] of Object.entries({ window: win, document: win.document, HTMLElement: win.HTMLElement, Element: win.Element, fetch: mockFetch, IS_REACT_ACT_ENVIRONMENT: true })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(win.document.getElementById("root")!);
  const settle = async () => {
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 220)); });
  };
  const assertHidden = () => assert.doesNotMatch(win.document.body.textContent ?? "", /123,?456|¥|到店自提价|价格待确认/);
  try {
    await act(async () => root.render(<InventorySection onOpenContact={() => { inquiries++; }} />));
    await settle();
    assert.equal(win.document.querySelectorAll("article").length, 1);
    assert.match(win.document.body.textContent ?? "", /九成新.*箱说齐全.*在保.*无维修史/s);
    assertHidden();
    const inquiry = [...win.document.querySelectorAll("button")].find(button => button.textContent?.includes("咨询商品"))!;
    await act(async () => inquiry.click());
    assert.equal(inquiries, 1);
    const details = win.document.querySelector("details")!;
    await act(async () => { details.open = true; details.dispatchEvent(new win.Event("toggle")); });
    await settle();
    assert(requests.some(query => query.includes("detailId=test-gpu-1")));
    assert.match(details.textContent ?? "", /测试规格.*测试库位.*test-gpu-1/s);
    assertHidden();
    await act(async () => (win.document.querySelector('[aria-label="下一页"]') as HTMLButtonElement).click());
    await settle();
    assert(requests.some(query => new URLSearchParams(query).get("page") === "2"));
    assert.match(win.document.body.textContent ?? "", /2 \/ 2/);
    assertHidden();
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
