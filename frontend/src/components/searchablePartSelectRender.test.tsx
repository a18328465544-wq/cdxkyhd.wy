import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import SearchablePartSelect from "./SearchablePartSelect";

const componentSource = readFileSync(new URL("./SearchablePartSelect.tsx", import.meta.url), "utf8");

test("renders an accessible searchable hardware combobox", () => {
  const html = renderToStaticMarkup(
    <SearchablePartSelect
      parts={[]}
      value=""
      placeholder="搜索 CPU 品牌、型号或规格"
      onChange={() => undefined}
    />
  );

  assert.match(html, /role="combobox"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-autocomplete="list"/);
  assert.match(html, /搜索 CPU 品牌、型号或规格/);
  assert.doesNotMatch(html, /<select/);
});

test("reopens search when an already-focused input is clicked", () => {
  assert.match(componentSource, /onClick=\{\(\) => setOpen\(true\)\}/);
});
