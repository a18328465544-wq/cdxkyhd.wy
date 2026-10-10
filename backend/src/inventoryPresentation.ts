export interface ErpInventoryPresentationSource {
  category?: string;
  status?: string;
  condition?: string;
  fullBox?: boolean;
  inWarranty?: boolean;
  repaired?: boolean;
  gpuRisk?: boolean;
  warehouseLocation?: string;
}

export function mapErpInventoryPresentation(card: ErpInventoryPresentationSource) {
  return {
    categoryLabel: card.category?.trim() || "未标注",
    status: card.status?.trim() || "未标注",
    condition: card.condition?.trim() || "未标注",
    fullBox: typeof card.fullBox === "boolean" ? card.fullBox : undefined,
    inWarranty: typeof card.inWarranty === "boolean" ? card.inWarranty : undefined,
    repaired: typeof card.repaired === "boolean" ? card.repaired : undefined,
    gpuRisk: typeof card.gpuRisk === "boolean" ? card.gpuRisk : undefined,
    warehouseLocation: card.warehouseLocation?.trim() || undefined,
  };
}
