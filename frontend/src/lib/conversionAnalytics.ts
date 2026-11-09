export type ConversionEvent = "wechat_estimate" | "product_inquiry" | "phone_click";

declare global {
  interface Window {
    _hmt?: Array<[string, ...unknown[]]>;
  }
}

export function trackConversion(event: ConversionEvent) {
  if (typeof window === "undefined") return;
  window._hmt?.push(["_trackEvent", "conversion", event]);
  const body = JSON.stringify({ event });
  if (navigator.sendBeacon?.("/api/conversions", new Blob([body], { type: "application/json" }))) return;
  void fetch("/api/conversions", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    keepalive: true,
  }).catch(() => {});
}
