import type { InventoryItem } from "./types/catalog.js";

export function publicInventoryItem({ publicSpecs: _publicSpecs, ...item }: InventoryItem) { return item; }

export function inventoryListItem(item: InventoryItem) {
  const { specs: _specs, warehouseLocation: _warehouse, wattage: _wattage, ...card } = publicInventoryItem(item);
  return card;
}

export function inventoryAvailability(item: InventoryItem) {
  const { id, name, category, price, quantity, status } = item;
  return { id, name, category, price, quantity, status, specs: item.publicSpecs ?? item.specs };
}

export function inventoryPickerItem(item: InventoryItem) {
  const { id, name, category, price, quantity, condition, pinCode, ramType, wattage } = item;
  return { id, name, category, price, quantity, condition, pinCode, ramType, wattage, specs: item.publicSpecs ?? item.specs };
}

export function inventoryPagination(query: Record<string, unknown>) {
  if ([query.page, query.pageSize].some(value => value !== undefined && typeof value !== "string")) return null;
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? 9);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 50) return null;
  return { page, pageSize };
}
