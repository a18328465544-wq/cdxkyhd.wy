import type { InventoryItem } from "./types/catalog.js";

const ERP_INVENTORY_CATEGORY_ORDER: InventoryItem["category"][] = [
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
];

interface InventoryCategoryLike {
  category?: string;
}

export function buildInventoryCategories(items: InventoryCategoryLike[] = []) {
  const discovered = items
    .map(item => item.category)
    .filter((category): category is string => Boolean(category) && category !== "All");

  return Array.from(new Set([...ERP_INVENTORY_CATEGORY_ORDER, ...discovered]));
}
