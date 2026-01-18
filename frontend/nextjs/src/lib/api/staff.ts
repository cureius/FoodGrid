const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) msg = body.message;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) return null as T;

  const text = await res.text();
  if (!text || text.trim().length === 0) return null as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null as T;
  }
}

function staffAuthHeader() {
  const token = typeof window !== "undefined" ? localStorage.getItem("fg_staff_access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function health() {
  return http<any>(`/q/health`, { method: "GET", headers: { ...staffAuthHeader() } });
}
