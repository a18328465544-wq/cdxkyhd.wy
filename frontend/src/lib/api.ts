const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL?.replace(/\/+$/, "") ?? "";

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(() => controller.abort(new DOMException("请求超时，请稍后重试。", "TimeoutError")), 15_000);
  try {
    const headers = new Headers(options.headers);
    if (typeof options.body === "string" && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const response = await fetch(apiUrl(path), {
      ...options,
      signal: controller.signal,
      credentials: "include",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error || data?.message || `API request failed: ${response.status}`;
      throw new Error(message);
    }

    return data as T;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}
