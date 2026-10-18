import type { Express } from "express";
import { GPU_SN_BRANDS, GPU_SN_RULES, parseGpuSnDate, type GpuSnBrandId } from "@cdxkyhd/shared";

export function registerGpuSnRoutes(app: Express) {
  app.get("/api/gpu-sn/rules", (_req, res) => {
    return res.json({ success: true, source: "shared-gpu-sn-rule-engine", data: GPU_SN_RULES });
  });

  app.post("/api/gpu-sn/parse", (req, res) => {
    const { brandId, sn, productModel } = req.body || {};
    if (!GPU_SN_BRANDS.some((brand) => brand.id === brandId) || typeof sn !== "string" || !sn.trim() || sn.trim().length > 40 || (productModel !== undefined && (typeof productModel !== "string" || productModel.length > 100))) {
      return res.status(400).json({ success: false, error: "请选择支持的品牌并输入有效 SN。" });
    }
    const data = parseGpuSnDate({
      brandId: brandId as GpuSnBrandId,
      sn: sn.trim(),
      productModel: typeof productModel === "string" ? productModel.trim() || undefined : undefined,
    });
    return res.json({ success: true, source: "shared-gpu-sn-rule-engine", data });
  });
}
