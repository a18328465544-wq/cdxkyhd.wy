export type ErpQueryValue = string | string[] | undefined;

export type ErpInventorySummaryRow = {
  key?: string;
  productId?: string;
  productName?: string;
  category?: string;
  brand?: string;
  model?: string;
  version?: string;
  vram?: string;
  warehouseLocation?: string;
  totalCount?: number;
  availableCount?: number;
  avgEstSell?: number;
  totalEstSell?: number;
  refSellPrice?: number;
  lastEntryTime?: string;
};

export type ErpInventoryCard = {
  id?: string;
  productId?: string;
  productName?: string;
  category?: string;
  brand?: string;
  model?: string;
  version?: string;
  vram?: string;
  sn?: string;
  status?: string;
  condition?: string;
  fullBox?: boolean;
  inWarranty?: boolean;
  repaired?: boolean;
  gpuRisk?: boolean;
  costPrice?: number;
  estSellPrice?: number;
  marketPrice?: number;
  warehouseLocation?: string;
};

export type ErpMarketQuote = {
  id?: string;
  productId?: string;
  productName?: string;
  model?: string;
  brand?: string;
  refBuyPrice?: number;
  todayBuyPrice?: number;
  yestBuyPrice?: number;
  refSellPrice?: number;
  todaySellPrice?: number;
  maxPrice?: number;
  trend?: "up" | "down" | "stable";
  changeAmount?: number;
  fluctuation?: string;
  updateTime?: string;
  history?: Array<{ date: string; buyPrice: number; sellPrice: number }>;
};
