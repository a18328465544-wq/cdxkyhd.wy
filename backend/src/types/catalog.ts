export interface InventoryItem {
  id: string;
  name: string;
  category: "GPU" | "CPU" | "Motherboard" | "RAM" | "SSD" | "PSU" | "Case" | "Cooler" | "WholeMachine" | "Monitor" | "Assembly" | "Accessories";
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
  publicSpecs?: string;
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
