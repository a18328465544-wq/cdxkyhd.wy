import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { act } from 'react';
import type { GpuPrice } from '../types';
import PriceSection, { RecyclingPriceTable } from './PriceSection';
import { useGpuPrices } from '../lib/useGpuPrices';

function OtherPriceConsumer() {
  const { prices, status } = useGpuPrices();
  return <output data-shared-price-status>{status}:{prices.length}</output>;
}

const quote = (name: string, basePrice = '1234', vram = '按行情档案'): GpuPrice => ({ name, basePrice, category: 'gaming', trend: 'stable', specs: { vram, tdp: '' } });

test('compact tables retain real price floors, inquiry states and keyboard actions', () => {
  const html = renderToStaticMarkup(<RecyclingPriceTable prices={[quote('RTX 5090 D V2', '28xxx'), quote('RTX 4090', '微信详询', '24GB')]} onEstimate={() => {}} />);
  assert.match(html, /¥28,000/);
  assert.match(html, /起/);
  assert.match(html, /微信询价/);
  assert.match(html, /aria-label="估价 RTX 5090 D V2"/);
  assert.match(html, /24GB/);
  assert.match(html, /min-h-11/);
  assert.match(html, /sm:min-h-9/);
  assert.match(html, /sr-only[^>]*>持平/);
  assert.doesNotMatch(html, /min-h-14|flex-col/);
  assert.doesNotMatch(html, /按行情档案|热门|28xxx|查看全部/);
});

test('live price section shows every quote and filters without collapsing the list', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/' });
  const win = dom.window;
  Object.defineProperty(win.document, 'visibilityState', { configurable: true, value: 'visible' });
  Object.defineProperty(win.document, 'hidden', { configurable: true, value: false });
  const originals = new Map<string, PropertyDescriptor | undefined>();
  const prices = [...Array.from({ length: 24 }, (_, index) => quote(`RTX ${5000 + index}`)), quote('RTX 4090'), quote('RTX A6000')];
  let calls = 0;
  let fail = true;
  let contacts = 0;
  for (const [key, value] of Object.entries({ window: win, document: win.document, HTMLElement: win.HTMLElement, Element: win.Element, IS_REACT_ACT_ENVIRONMENT: true, fetch: async () => {
    calls++;
    if (fail) throw new Error('Test API unavailable');
    return new Response(JSON.stringify({ success: true, prices }), { headers: { 'Content-Type': 'application/json' } });
  } })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(win.document.getElementById('root')!);
  try {
    await act(async () => root.render(<><PriceSection onOpenContact={() => { contacts++; }} onEstimate={() => {}} /><OtherPriceConsumer /></>));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 50)); });
    assert.equal(calls, 1);
    assert.equal(win.document.querySelectorAll('[data-recycling-model]').length, 0);
    assert.match(win.document.body.textContent ?? '', /行情暂时无法读取/);
    fail = false;
    const retry = [...win.document.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes('重新读取'))!;
    await act(async () => retry.click());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 50)); });
    assert.equal(calls, 2);
    assert.equal(win.document.querySelector('[data-shared-price-status]')?.textContent, 'ready:26');
    assert.equal(win.document.querySelectorAll('[data-recycling-model]').length, 26);
    assert.equal(win.document.querySelectorAll('[data-recycling-columns] table').length, 2);
    assert.doesNotMatch(win.document.body.textContent ?? '', /查看全部|按行情档案|热门/);
    assert.match(win.document.body.textContent ?? '', /页面读取.*非报价更新时间/s);
    const professional = [...win.document.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(button => button.textContent?.includes('专业卡'))!;
    await act(async () => professional.click());
    assert.equal(win.document.querySelectorAll('[data-recycling-model]').length, 1);
    assert.equal(win.document.querySelector('[data-recycling-model]')?.getAttribute('data-recycling-model'), 'RTX A6000');
    const all = [...win.document.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(button => button.textContent?.includes('全部'))!;
    await act(async () => all.click());
    assert.equal(win.document.querySelectorAll('[data-recycling-model]').length, 26);
    const contact = [...win.document.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes('微信确认回收价'))!;
    await act(async () => contact.click());
    assert.equal(contacts, 1);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
