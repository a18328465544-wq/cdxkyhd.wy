import { buildInventoryCategoryTabs } from "./inventoryCategories";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const fromBackend = buildInventoryCategoryTabs(
  [
    { key: "GPU", label: "显卡现货" },
    { key: "CPU", label: "处理器现货" },
  ],
  [{ category: "RAM" }]
);

assert(fromBackend.map(tab => tab.key).join(",") === "GPU,CPU", "backend category order should be used without an all-inventory tab");
assert(fromBackend[0].label === "显卡现货", "backend labels should be used when provided");

const fromItems = buildInventoryCategoryTabs(undefined, [
  { category: "GPU" },
  { category: "GPU" },
  { category: "Motherboard" },
]);

assert(fromItems.map(tab => tab.key).join(",") === "GPU,Motherboard", "items should provide fallback categories without duplicates");
assert(fromItems[1].label === "主板", "known category fallback labels should be localized");

const withAllFromBackend = buildInventoryCategoryTabs(
  ["All", { key: "GPU", label: "显卡现货" }],
  []
);

assert(withAllFromBackend.map(tab => tab.key).join(",") === "GPU", "all-inventory category should not be shown even if a backend includes it");

const fullErpCategories = buildInventoryCategoryTabs(
  ["GPU", "CPU", "Motherboard", "RAM", "SSD", "PSU", "Cooler", "Case", "WholeMachine", "Monitor", "Assembly", "Accessories"],
  []
);

assert(
  fullErpCategories.map(tab => tab.label).join(",") === "GPU 显卡,CPU 处理器,主板,内存,固态硬盘,电源,散热,机箱,整机,显示器,组装拆卸,配件",
  "website category labels should cover every ERP product category",
);
