import assert from "node:assert/strict";
import test from "node:test";

import { buildInventoryCategories } from "./inventoryCategories.js";

test("inventory categories match the ERP product categories even when stocked items are missing", () => {
  assert.deepEqual(
    buildInventoryCategories([
      { category: "GPU" },
      { category: "RAM" },
      { category: "Accessories" },
    ]),
    [
      "GPU",
      "CPU",
      "Motherboard",
      "RAM",
      "SSD",
      "PSU",
      "Cooler",
      "Case",
      "WholeMachine",
      "Monitor",
      "Assembly",
      "Accessories",
    ],
  );
});

test("inventory categories never expose an all-inventory tab", () => {
  assert(!buildInventoryCategories([{ category: "All" }]).includes("All"));
});
