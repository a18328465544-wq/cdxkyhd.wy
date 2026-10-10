const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ?? "";

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error || data?.message || `API request failed: ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}
