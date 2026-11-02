import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import GpuRankingPage from "./GpuRankingPage";

test("GPU ranking renders ERP controls, independent categories, and an honest loading state", () => {
  const html = renderToStaticMarkup(
    <GpuRankingPage onOpenContact={() => undefined} />,
  );
  assert.match(html, /显卡性能天梯/);
  assert.match(html, /aria-label="测试项目"/);
  assert.match(html, /aria-label="显卡类型"/);
  assert.match(html, /aria-label="最低显存"/);
  assert.doesNotMatch(html, /门店预算|不限门店价格|门店在售起价/);
  assert.match(html, /data-erp-control="select"/);
  assert.match(html, /正在读取成绩/);
  assert.doesNotMatch(html, /203\.8 FPS|100\.0%|相对成绩.*100/);
});
