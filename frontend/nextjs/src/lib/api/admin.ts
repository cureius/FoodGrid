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

  return (await res.json()) as T;
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
