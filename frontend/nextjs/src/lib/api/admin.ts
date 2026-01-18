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

  // Handle empty responses (e.g., DELETE requests that return void)
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return null as T;
  }

  // Check if response has content
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

function adminAuthHeader() {
  const token = typeof window !== "undefined" ? localStorage.getItem("fg_admin_access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function adminLogin(input: { email: string; password: string }) {
  return http<any>(`/api/v1/admin/auth/login`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export type EmployeeUpsertInput = {
  displayName: string;
  email: string;
  avatarUrl?: string;
  status?: string;
  pin?: string;
};

export function listEmployees(outletId: string) {
  return http<any[]>(`/api/v1/admin/outlets/${encodeURIComponent(outletId)}/employees`, {
    method: "GET",
    headers: {
      ...adminAuthHeader()
    }
  });
}

export function createEmployee(outletId: string, input: EmployeeUpsertInput) {
  return http<any>(`/api/v1/admin/outlets/${encodeURIComponent(outletId)}/employees`, {
    method: "POST",
    headers: {
      ...adminAuthHeader()
    },
    body: JSON.stringify(input)
  });
}

export function updateEmployee(outletId: string, employeeId: string, input: EmployeeUpsertInput) {
  return http<any>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/employees/${encodeURIComponent(employeeId)}`,
    {
      method: "PUT",
      headers: {
        ...adminAuthHeader()
      },
      body: JSON.stringify(input)
    }
  );
}

export function deleteEmployee(outletId: string, employeeId: string) {
  return http<void>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/employees/${encodeURIComponent(employeeId)}`,
    {
      method: "DELETE",
      headers: {
        ...adminAuthHeader()
      }
    }
  );
}

export type OutletUpsertInput = {
  name: string;
  timezone: string;
};

export function listOutlets() {
  return http<any[]>(`/api/v1/admin/outlets`, {
    method: "GET",
    headers: {
      ...adminAuthHeader()
    }
  });
}

export function createOutlet(input: OutletUpsertInput) {
  return http<any>(`/api/v1/admin/outlets`, {
    method: "POST",
    headers: {
      ...adminAuthHeader()
    },
    body: JSON.stringify(input)
  });
}

export function updateOutlet(outletId: string, input: OutletUpsertInput) {
  return http<any>(`/api/v1/admin/outlets/${encodeURIComponent(outletId)}`, {
    method: "PUT",
    headers: {
      ...adminAuthHeader()
    },
    body: JSON.stringify(input)
  });
}

export function deleteOutlet(outletId: string) {
  return http<void>(`/api/v1/admin/outlets/${encodeURIComponent(outletId)}`, {
    method: "DELETE",
    headers: {
      ...adminAuthHeader()
    }
  });
}

export type TenantUpsertInput = {
  name: string;
  contactEmail?: string;
  status?: string;
};

export function listTenants() {
  return http<any[]>(`/api/v1/admin/tenants`, {
    method: "GET",
    headers: {
      ...adminAuthHeader()
    }
  });
}

export function getTenant(tenantId: string) {
  return http<any>(`/api/v1/admin/tenants/${encodeURIComponent(tenantId)}`, {
    method: "GET",
    headers: {
      ...adminAuthHeader()
    }
  });
}

export function createTenant(input: TenantUpsertInput) {
  return http<any>(`/api/v1/admin/tenants`, {
    method: "POST",
    headers: {
      ...adminAuthHeader()
    },
    body: JSON.stringify(input)
  });
}

export function updateTenant(tenantId: string, input: TenantUpsertInput) {
  return http<any>(`/api/v1/admin/tenants/${encodeURIComponent(tenantId)}`, {
    method: "PUT",
    headers: {
      ...adminAuthHeader()
    },
    body: JSON.stringify(input)
  });
}

export function deleteTenant(tenantId: string) {
  return http<any>(`/api/v1/admin/tenants/${encodeURIComponent(tenantId)}`, {
    method: "DELETE",
    headers: {
      ...adminAuthHeader()
    }
  });
}

export function activateTenant(tenantId: string) {
  return http<any>(`/api/v1/admin/tenants/${encodeURIComponent(tenantId)}/activate`, {
    method: "PUT",
    headers: {
      ...adminAuthHeader()
    }
  });
}

export function deactivateTenant(tenantId: string) {
  return http<any>(`/api/v1/admin/tenants/${encodeURIComponent(tenantId)}/deactivate`, {
    method: "PUT",
    headers: {
      ...adminAuthHeader()
    }
  });
}
