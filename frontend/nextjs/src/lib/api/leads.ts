export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

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
  if (!contentType || !contentType.includes("application/json")) {
    return null as T;
  }

  const text = await res.text();
  if (!text || text.trim().length === 0) {
    return null as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null as T;
  }
}

function adminOnlyAuthHeader(): Record<string, string> {
  const tenantAdminToken = typeof window !== "undefined" ? localStorage.getItem("fg_tenant_admin_access_token") : null;
  if (tenantAdminToken) {
    return { Authorization: `Bearer ${tenantAdminToken}` };
  }
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("fg_admin_access_token") : null;
  return adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
}

export type LeadStatus = "DISCOVERED" | "QUALIFIED" | "CONTACTED" | "PITCHED" | "DEMO_SCHEDULED" | "FOLLOW_UP" | "CONVERTED" | "LOST";

export type Lead = {
  id: number;
  externalPlaceId: string;
  name: string;
  category: string;
  city: string;
  area: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  status: LeadStatus;
  score: number;
  createdAt: string;
  updatedAt: string;
  contacts?: any[];
  activities?: any[];
};

export function listLeads(filters: { status?: LeadStatus; city?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.city) params.append("city", filters.city);
  
  return http<Lead[]>(`/api/v1/internal/leads?${params.toString()}`, {
    method: "GET",
    headers: adminOnlyAuthHeader()
  });
}

export function getLead(id: number) {
  return http<Lead>(`/api/v1/internal/leads/${id}`, {
    method: "GET",
    headers: adminOnlyAuthHeader()
  });
}

export function updateLeadStatus(id: number, status: LeadStatus) {
  return http<void>(`/api/v1/internal/leads/${id}/status?status=${status}`, {
    method: "PATCH",
    headers: adminOnlyAuthHeader()
  });
}

export function addLeadActivity(id: number, activity: { channel: string; outcome: string; performedBy: string }) {
    const params = new URLSearchParams(activity);
    return http<void>(`/api/v1/internal/leads/${id}/activities?${params.toString()}`, {
        method: "POST",
        headers: adminOnlyAuthHeader()
    });
}

export function triggerLeadDiscovery(city: string, area: string, category: string) {
    const params = new URLSearchParams({ city, area, category });
    return http<void>(`/api/v1/internal/leads/discover?${params.toString()}`, {
        method: "POST",
        headers: adminOnlyAuthHeader()
    });
}

export function triggerLeadEnrichment() {
    return http<void>(`/api/v1/internal/leads/enrich`, {
        method: "POST",
        headers: adminOnlyAuthHeader()
    });
}

export function submitLead(data: { name: string; phone: string; email: string; restaurantName: string; city: string }) {
    return http<{ success: boolean }>(`/api/v1/public/leads/submit`, {
        method: "POST",
        body: JSON.stringify(data)
    });
}

