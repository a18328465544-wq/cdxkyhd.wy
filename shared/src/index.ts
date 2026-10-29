export type InventoryCategory =
  | "GPU"
  | "CPU"
  | "Motherboard"
  | "RAM"
  | "SSD"
  | "PSU"
  | "Case"
  | "Cooler"
  | "WholeMachine"
  | "Monitor"
  | "Assembly"
  | "Accessories";

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  price: number;
  quantity: number;
  condition: string;
  categoryLabel?: string;
  fullBox?: boolean;
  inWarranty?: boolean;
  repaired?: boolean;
  gpuRisk?: boolean;
  warehouseLocation?: string;
  specs: string;
  status: string;
  pinCode?: string;
  ramType?: "DDR4" | "DDR5" | "ECC DDR5";
  wattage?: number;
}

export interface GpuPrice {
  name: string;
  category: "gaming" | "ai" | "both";
  basePrice: string;
  trend: "up" | "down" | "stable";
  popular?: boolean;
  specs: {
    vram: string;
    tdp: string;
    cuda?: string;
  };
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BuildRequest {
  cpuId?: string;
  gpuId?: string;
  mbId?: string;
  ramId?: string;
  ssdId?: string;
  psuId?: string;
  coolerId?: string;
  caseId?: string;
}

export * from "./gpuSnDate.js";
export * from "./gpuRankingModels.js";
export * from "./gpuRankingTypes.js";
export * from "./seoPages.js";
export * from "./prlMarket.js";
export * from "./gpuCatalog.js";
export * from "./gpuDailyPrices.js";
export * from "./gpuPriceHistory.js";
export * from "./contact.js";
