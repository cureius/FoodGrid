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

function tenantAdminAuthHeader() {
  const token = typeof window !== "undefined" ? localStorage.getItem("fg_tenant_admin_access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// For ADMIN-only endpoints, try tenant admin token first (as TENANT_ADMIN users may have ADMIN role),
// then fall back to admin token
function adminOnlyAuthHeader() {
  const tenantAdminToken = typeof window !== "undefined" ? localStorage.getItem("fg_tenant_admin_access_token") : null;
  if (tenantAdminToken) {
    return { Authorization: `Bearer ${tenantAdminToken}` };
  }
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("fg_admin_access_token") : null;
  return adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
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

export type PaymentGatewayType = 
  | "RAZORPAY"
  | "STRIPE"
  | "PAYU"
  | "PHONEPE"
  | "CASHFREE"
  | "BHARATPAY";

export type TenantResponse = {
  id: string;
  name: string;
  contactEmail: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  adminUserId: string | null;
  adminEmail: string | null;
  adminDisplayName: string | null;
  adminPassword: string | null;
  defaultGatewayType: PaymentGatewayType | null;
  paymentEnabled: boolean;
  autoCaptureEnabled: boolean;
  partialRefundEnabled: boolean;
  webhookUrl: string | null;
  paymentGatewayConfig: string | null;
};

export type TenantUpsertInput = {
  name: string;
  contactEmail?: string;
  status?: string;
  adminEmail?: string;
  adminPassword?: string;
  adminDisplayName?: string;
};

export type PaymentGatewayUpdateRequest = {
  gatewayType: PaymentGatewayType | null;
  apiKey: string;
  secretKey: string;
  webhookSecret: string;
  merchantId: string;
  isActive: boolean;
  isLiveMode: boolean;
  additionalConfig?: string;
  autoCaptureEnabled: boolean;
  partialRefundEnabled: boolean;
  webhookUrl?: string;
};

export function listTenants() {
  return http<TenantResponse[]>(`/api/v1/admin/tenants`, {
    method: "GET",
    headers: {
      ...tenantAdminAuthHeader()
    }
  });
}

export function getTenant(tenantId: string) {
  return http<TenantResponse>(`/api/v1/admin/tenants/${encodeURIComponent(tenantId)}`, {
    method: "GET",
    headers: {
      ...tenantAdminAuthHeader()
    }
  });
}

export function createTenant(input: TenantUpsertInput) {
  return http<TenantResponse>(`/api/v1/admin/tenants`, {
    method: "POST",
    headers: {
      ...tenantAdminAuthHeader()
    },
    body: JSON.stringify(input)
  });
}

export function updateTenant(tenantId: string, input: TenantUpsertInput) {
  return http<TenantResponse>(`/api/v1/admin/tenants/${encodeURIComponent(tenantId)}`, {
    method: "PUT",
    headers: {
      ...tenantAdminAuthHeader()
    },
    body: JSON.stringify(input)
  });
}

export function deleteTenant(tenantId: string) {
  return http<void>(`/api/v1/admin/tenants/${encodeURIComponent(tenantId)}`, {
    method: "DELETE",
    headers: {
      ...tenantAdminAuthHeader()
    }
  });
}

export function activateTenant(tenantId: string) {
  return http<TenantResponse>(`/api/v1/admin/tenants/${encodeURIComponent(tenantId)}/activate`, {
    method: "PUT",
    headers: {
      ...tenantAdminAuthHeader()
    }
  });
}

export function deactivateTenant(tenantId: string) {
  return http<TenantResponse>(`/api/v1/admin/tenants/${encodeURIComponent(tenantId)}/deactivate`, {
    method: "PUT",
    headers: {
      ...tenantAdminAuthHeader()
    }
  });
}

// Payment Gateway Management Functions (Admin only)
export function updateTenantPaymentGateway(tenantId: string, input: PaymentGatewayUpdateRequest) {
  return http<TenantResponse>(`/api/v1/admin/tenants/${encodeURIComponent(tenantId)}/payment-gateway`, {
    method: "PUT",
    headers: {
      ...adminOnlyAuthHeader()
    },
    body: JSON.stringify(input)
  });
}

export function toggleTenantPayments(tenantId: string, enabled: boolean) {
  return http<TenantResponse>(`/api/v1/admin/tenants/${encodeURIComponent(tenantId)}/toggle-payments?enabled=${enabled}`, {
    method: "PUT",
    headers: {
      ...adminOnlyAuthHeader()
    }
  });
}

export function getTenantsWithPaymentsEnabled() {
  return http<TenantResponse[]>(`/api/v1/admin/tenants/payments-enabled`, {
    method: "GET",
    headers: {
      ...adminOnlyAuthHeader()
    }
  });
}

export function getActiveTenantsWithPaymentsEnabled() {
  return http<TenantResponse[]>(`/api/v1/admin/tenants/active-with-payments`, {
    method: "GET",
    headers: {
      ...adminOnlyAuthHeader()
    }
  });
}

export function getSupportedGatewayTypes() {
  return http<PaymentGatewayType[]>(`/api/v1/payment-config/gateway-types`, {
    method: "GET",
    headers: {
      ...tenantAdminAuthHeader()
    }
  });
}

// Payment Config API Types
export type PaymentConfigRequest = {
  gatewayType: PaymentGatewayType;
  apiKey: string;
  secretKey: string;
  webhookSecret?: string;
  merchantId?: string;
  isActive: boolean;
  isLiveMode: boolean;
  additionalConfig?: string;
  autoCaptureEnabled: boolean;
  partialRefundEnabled: boolean;
  webhookUrl?: string;
};

export type PaymentConfigResponse = {
  id: string;
  clientId: string;
  gatewayType: PaymentGatewayType;
  apiKey: string;
  secretKey: string;
  webhookSecret: string;
  merchantId?: string;
  isActive: boolean;
  isLiveMode: boolean;
  createdAt: string;
  updatedAt: string;
  additionalConfig?: string;
  autoCaptureEnabled: boolean;
  partialRefundEnabled: boolean;
  webhookUrl?: string;
};

export type GatewayTypeInfo = {
  type: PaymentGatewayType;
  displayName: string;
  defaultCurrency: string;
  isImplemented: boolean;
};

export type ValidationResult = {
  valid: boolean;
};

// Payment Config API Functions
export function createPaymentConfig(clientId: string, request: PaymentConfigRequest) {
  return http<PaymentConfigResponse>(`/api/v1/payment-config/${encodeURIComponent(clientId)}`, {
    method: "POST",
    headers: {
      ...adminOnlyAuthHeader()
    },
    body: JSON.stringify(request)
  });
}

export function updatePaymentConfig(configId: string, request: PaymentConfigRequest) {
  return http<PaymentConfigResponse>(`/api/v1/payment-config/${encodeURIComponent(configId)}`, {
    method: "PUT",
    headers: {
      ...adminOnlyAuthHeader()
    },
    body: JSON.stringify(request)
  });
}

export function listPaymentConfigs(clientId: string, activeOnly: boolean = false) {
  const queryParam = activeOnly ? "?activeOnly=true" : "";
  return http<PaymentConfigResponse[]>(`/api/v1/payment-config?clientId=${encodeURIComponent(clientId)}${queryParam}`, {
    method: "GET",
    headers: {
      ...adminOnlyAuthHeader()
    }
  });
}

export function getPaymentConfig(configId: string) {
  return http<PaymentConfigResponse>(`/api/v1/payment-config/${encodeURIComponent(configId)}`, {
    method: "GET",
    headers: {
      ...adminOnlyAuthHeader()
    }
  });
}

export function deactivatePaymentConfig(clientId: string, gatewayType: PaymentGatewayType) {
  return http<void>(`/api/v1/payment-config/${encodeURIComponent(gatewayType)}/${encodeURIComponent(clientId)}`, {
    method: "DELETE",
    headers: {
      ...adminOnlyAuthHeader()
    }
  });
}

export function reactivatePaymentConfig(configId: string) {
  return http<PaymentConfigResponse>(`/api/v1/payment-config/${encodeURIComponent(configId)}/reactivate`, {
    method: "PUT",
    headers: {
      ...adminOnlyAuthHeader()
    }
  });
}

export function validatePaymentCredentials(clientId: string, gatewayType: PaymentGatewayType) {
  return http<ValidationResult>(`/api/v1/payment-config/validate/${encodeURIComponent(gatewayType)}/${encodeURIComponent(clientId)}`, {
    method: "POST",
    headers: {
      ...adminOnlyAuthHeader()
    }
  });
}

export function getSupportedGateways() {
  return http<GatewayTypeInfo[]>(`/api/v1/payment-config/gateways`, {
    method: "GET",
    headers: {
      ...adminOnlyAuthHeader()
    }
  });
}
