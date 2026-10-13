import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, Input, SearchInput, SegmentedControl, Select, Textarea } from "./controls";

test("ERP button keeps explicit action semantics and state", () => {
  const html = renderToStaticMarkup(<Button variant="primary" loading>提交</Button>);
  assert.match(html, /type="button"/);
  assert.match(html, /disabled=""/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /data-variant="primary"/);
});

test("ERP fields retain native input attributes and shared control hooks", () => {
  const input = renderToStaticMarkup(<Input required placeholder="姓名" />);
  const search = renderToStaticMarkup(<SearchInput aria-label="搜索库存" />);
  const textarea = renderToStaticMarkup(<Textarea rows={3} />);
  assert.match(input, /data-erp-control="input"/);
  assert.match(input, /required=""/);
  assert.match(search, /type="search"/);
  assert.match(search, /aria-label="搜索库存"/);
  assert.match(textarea, /data-erp-control="textarea"/);
});

test("ERP category controls expose the selected state", () => {
  const html = renderToStaticMarkup(<SegmentedControl label="库存类目" options={[{value: "gpu", label: "显卡"}, {value: "cpu", label: "处理器"}]} value="gpu" onChange={() => undefined} />);
  assert.match(html, /role="tablist"/);
  assert.match(html, /aria-label="库存类目"/);
  assert.match(html, /aria-selected="true"/);
  assert.match(html, /aria-selected="false"/);
});

test("ERP select renders its chosen option without a native select", () => {
  const html = renderToStaticMarkup(<Select value="gpu" options={[{value: "gpu", label: "显卡"}]} onValueChange={() => undefined} aria-label="话题分类" />);
  assert.match(html, /data-erp-control="select"/);
  assert.match(html, /显卡/);
  assert.doesNotMatch(html, /<select/);
});
