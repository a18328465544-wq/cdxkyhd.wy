import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { emptyDailyGpuPrices, type DailyGpuOffer } from "@cdxkyhd/shared";
import { DailyPriceCard } from "./GpuDailyPage";

test("customer price card displays cents, actual merchant, terms, time and a safe external link", () => {
  const row = emptyDailyGpuPrices().rows[1];
  const offer: DailyGpuOffer = { platform: "pdd", platform_name: "拼多多", merchant: "TEST <商家>",
    title: "TEST 全新 RTX 5060 8GB", price_cents: 200099, currency: "CNY",
    url: "https://mobile.yangkeduo.com/goods.html?goods_id=123", observed_at: "2026-10-21T10:15:00+08:00",
    conditions: ["满100减5优惠券"], terms: "以商家页面为准" };
  const html = renderToStaticMarkup(createElement(DailyPriceCard, { row: { ...row, status: "available", offers: [offer], lowest: offer } }));
  assert.match(html, /2,000\.99/);
  assert.match(html, /TEST &lt;商家&gt;/);
  assert.match(html, /10:15/);
  assert.match(html, /满100减5优惠券/);
  assert.match(html, /rel="noopener noreferrer nofollow"/);
  assert.match(html, /goods_id=123/);
});

test("missing and pending prices have no zero-price placeholder or merchant purchase link", () => {
  const row = emptyDailyGpuPrices().rows[0];
  for (const status of ["unavailable", "awaiting_review"] as const) {
    const html = renderToStaticMarkup(createElement(DailyPriceCard, { row: { ...row, status } }));
    assert.doesNotMatch(html, /¥0|前往商家|goods_id=/);
    assert.match(html, status === "awaiting_review" ? /今日报价信息待完善/ : /今日待更新/);
    assert.match(html,/官方首发建议零售价/);assert.match(html,/2,099/);assert.match(html,/nvidia\.cn/);
  }
});

test("USD launch MSRP is labelled and never compared directly against a CNY offer",()=>{
  const row=emptyDailyGpuPrices().rows[7];
  const offer:DailyGpuOffer={platform:"pdd",platform_name:"拼多多",merchant:"合成商家",title:"全新RTX5090 32GB",price_cents:5350000,currency:"CNY",url:"https://mobile.yangkeduo.com/goods.html?goods_id=123",observed_at:"2026-10-29T10:00:00+08:00",conditions:[],terms:"合成测试"};
  const html=renderToStaticMarkup(createElement(DailyPriceCard,{row:{...row,status:"available",offers:[offer],lowest:offer}}));
  assert.match(html,/US\$1,999/);assert.match(html,/美国/);assert.match(html,/未做汇率换算/);assert.doesNotMatch(html,/较官方首发建议价/);
});
