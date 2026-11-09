import { onCLS, onINP, onLCP, type Metric } from "web-vitals";

const publicPaths = new Set(["/", "/build", "/gpu-ranking", "/gpu-daily", "/gpu-sn.php", "/gpu-sn", "/community", "/tools", "/tools/keyboard", "/tools/mouse", "/tools/audio", "/tools/monitor", "/tools/hashrate-rental"]);

export function startPerformanceMetrics() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (!publicPaths.has(path)) return;
  const report = (metric: Metric) => {
    const body = JSON.stringify({ path, name: metric.name, value: Math.round(metric.value * 1000) / 1000, device: matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop" });
    // No URL query, identifiers, cookies, hardware details or form values are sent.
    void fetch("/api/performance", { method: "POST", body, headers: { "Content-Type": "application/json" }, credentials: "omit", keepalive: true }).catch(() => {});
  };
  onCLS(report);
  onINP(report);
  onLCP(report);
}
