import type { GpuPrice } from "../types";

export type Condition = "perfect" | "good" | "average" | "poor";
export type BrandTier = "high" | "mid" | "basic";

export interface ParsedPrice {
  value: number;
  /** True when the quote hides trailing digits ("28xxx"), i.e. it is a floor, not an exact figure. */
  isFloor: boolean;
}

/** "28xxx" -> 28000 (floor), "82xx" -> 8200 (floor), "24500" / "24,500" -> 24500 (exact). */
export function parseBasePrice(basePrice: string): ParsedPrice | null {
  const trimmed = basePrice.trim().toLowerCase();
  const isFloor = /x/.test(trimmed);
  const value = Number(trimmed.replace(/x/g, "0").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(value) || value <= 0) return null;
  return { value, isFloor };
}

export function formatYuan(value: number): string {
  return `¥${Math.round(value).toLocaleString("zh-CN")}`;
}

export const CONDITION_OPTIONS: { value: Condition; label: string; hint: string; multiplier: number }[] = [
  { value: "perfect", label: "准新在保", hint: "国行在保 · 盒说齐全 · 无拆", multiplier: 1 },
  { value: "good", label: "无拆无修", hint: "已过保 · 仅有微尘", multiplier: 0.95 },
  { value: "average", label: "正常使用", hint: "轻微氧化 · 红标", multiplier: 0.88 },
  { value: "poor", label: "有瑕疵", hint: "微板弯 · 拆修 · 核心偏暗", multiplier: 0.78 },
];

export const BRAND_OPTIONS: { value: BrandTier; label: string; hint: string; premium: number }[] = [
  { value: "high", label: "旗舰款", hint: "ROG 等高端型号", premium: 250 },
  { value: "mid", label: "主流款", hint: "七彩虹 / 影驰等", premium: 100 },
  { value: "basic", label: "入门款", hint: "丐版 / 拆机卡", premium: -150 },
];

/** Returns the estimated payout in yuan, or null when the model has no usable quote. */
export function estimatePayout(gpu: GpuPrice | undefined, condition: Condition, brand: BrandTier): number | null {
  if (!gpu) return null;
  const parsed = parseBasePrice(gpu.basePrice);
  if (!parsed) return null;
  const multiplier = CONDITION_OPTIONS.find(option => option.value === condition)?.multiplier ?? 1;
  const premium = BRAND_OPTIONS.find(option => option.value === brand)?.premium ?? 0;
  const estimate = Math.round((parsed.value * multiplier + premium) / 50) * 50;
  return estimate >= 100 ? estimate : null;
}
