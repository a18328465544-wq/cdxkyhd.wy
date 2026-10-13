import { useEffect, useState } from "react";
import { GPU_PRICES_DATA } from "../data";
import type { GpuPrice } from "../types";
import { apiFetch } from "./api";

let pricesRequest: Promise<GpuPrice[]> | null = null;

function loadGpuPrices(): Promise<GpuPrice[]> {
  pricesRequest ??= apiFetch<{ success: boolean; prices: GpuPrice[] }>("/api/prices")
    .then(data => (data?.success && Array.isArray(data.prices) && data.prices.length > 0 ? data.prices : GPU_PRICES_DATA))
    .catch(error => {
      console.warn("API /api/prices is offline, using static quotes:", error);
      return GPU_PRICES_DATA;
    });
  return pricesRequest;
}

/** Shared by the hero estimator and the price table so the quote list is fetched once. */
export function useGpuPrices(): GpuPrice[] {
  const [prices, setPrices] = useState<GpuPrice[]>(GPU_PRICES_DATA);
  useEffect(() => {
    let active = true;
    loadGpuPrices().then(next => {
      if (active) setPrices(next);
    });
    return () => {
      active = false;
    };
  }, []);
  return prices;
}
