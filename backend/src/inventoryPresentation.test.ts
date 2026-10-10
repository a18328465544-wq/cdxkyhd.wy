import assert from "node:assert/strict";
import test from "node:test";

import { mapErpInventoryPresentation } from "./inventoryPresentation.js";

test("ERP inventory presentation keeps every inventory marker", () => {
  assert.deepEqual(
    mapErpInventoryPresentation({
      category: "显卡",
      status: "已上架",
      condition: "靓机95新",
      fullBox: true,
      inWarranty: true,
      repaired: false,
      gpuRisk: false,
      warehouseLocation: "A区货架-01",
    }),
    {
      categoryLabel: "显卡",
      status: "已上架",
      condition: "靓机95新",
      fullBox: true,
      inWarranty: true,
      repaired: false,
      gpuRisk: false,
      warehouseLocation: "A区货架-01",
    },
  );

  assert.deepEqual(
    mapErpInventoryPresentation({
      category: "显卡",
      status: "已入库",
      condition: "微划伤85新",
      fullBox: false,
      inWarranty: false,
      repaired: true,
      gpuRisk: true,
      warehouseLocation: "C货架-02",
    }),
    {
      categoryLabel: "显卡",
      status: "已入库",
      condition: "微划伤85新",
      fullBox: false,
      inWarranty: false,
      repaired: true,
      gpuRisk: true,
      warehouseLocation: "C货架-02",
    },
  );
});

test("ERP inventory presentation handles missing labels without inventing condition", () => {
  assert.deepEqual(
    mapErpInventoryPresentation({}),
    {
      categoryLabel: "未标注",
      status: "未标注",
      condition: "未标注",
      fullBox: undefined,
      inWarranty: undefined,
      repaired: undefined,
      gpuRisk: undefined,
      warehouseLocation: undefined,
    },
  );
});
