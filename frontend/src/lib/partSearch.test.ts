import assert from "node:assert/strict";
import test from "node:test";

import { filterParts } from "./partSearch";

const parts = [
  {
    id: "cpu-1",
    name: "华硕 Intel i9-14900K",
    specs: "24核 LGA1700",
    condition: "全新",
    price: 3999,
  },
  {
    id: "gpu-1",
    name: "七彩虹 RTX 5090",
    specs: "32GB GDDR7",
    condition: "靓机95新",
    price: 19999,
  },
];

test("filters parts across name, specs and condition", () => {
  assert.deepEqual(filterParts(parts, "  RTX  ").map(part => part.id), ["gpu-1"]);
  assert.deepEqual(filterParts(parts, "lga1700").map(part => part.id), ["cpu-1"]);
  assert.deepEqual(filterParts(parts, "95新").map(part => part.id), ["gpu-1"]);
});

test("returns all parts for an empty query and none for no match", () => {
  assert.equal(filterParts(parts, "").length, 2);
  assert.equal(filterParts(parts, "不存在").length, 0);
});
