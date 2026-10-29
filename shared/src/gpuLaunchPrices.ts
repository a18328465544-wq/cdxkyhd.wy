/** NVIDIA desktop launch MSRP; currency and region must never be inferred. */
export interface GpuLaunchPrice {
  amount_cents: number;
  currency: "CNY" | "USD";
  region: "中国大陆" | "美国";
  source_url: string;
  source_name: "NVIDIA 官方";
  checked_on: "2026-10-29";
}
const sources = {
  entry: "https://www.nvidia.cn/geforce/news/rtx-5050-desktop-gpu-and-laptops/",
  sixty: "https://www.nvidia.cn/geforce/news/gfecnt/20254/rtx-5060-desktop-family-laptop-5060-coming-soon/",
  seventy: "https://www.nvidia.cn/geforce/graphics-cards/50-series/rtx-5070-family/",
  launch: "https://www.nvidia.cn/geforce/news/rtx-50-series-graphics-cards-gpu-laptop-announcements/",
  us: "https://www.nvidia.com/en-us/geforce/news/rtx-50-series-graphics-cards-gpu-laptop-announcements/",
  dv2: "https://www.nvidia.cn/geforce/graphics-cards/50-series/rtx-5090-d-v2/",
};
const cny = (amount: number, source_url: string): GpuLaunchPrice => ({ amount_cents: amount * 100,
  currency: "CNY", region: "中国大陆", source_url, source_name: "NVIDIA 官方", checked_on: "2026-10-29" });
export const GPU_LAUNCH_PRICES: Readonly<Record<string, GpuLaunchPrice>> = {
  "5050": cny(2099, sources.entry), "5060": cny(2499, sources.sixty),
  "5060ti8": cny(3199, sources.sixty), "5060ti16": cny(3599, sources.sixty),
  "5070": cny(4599, sources.seventy), "5070ti": cny(6299, sources.seventy),
  "5080": cny(8299, sources.launch), "5090d": cny(16499, sources.launch),
  "5090dv2": cny(16499, sources.dv2),
  "5090": { amount_cents: 199900, currency: "USD", region: "美国", source_url: sources.us,
    source_name: "NVIDIA 官方", checked_on: "2026-10-29" },
};
