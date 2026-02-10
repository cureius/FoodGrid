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

function staffAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("fg_staff_access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Health check
export function health() {
  return http<any>(`/q/health`, { method: "GET", headers: { ...staffAuthHeader() } });
}

// Order Management APIs (POS endpoints)
export type OrderResponse = {
  id: string;
  outletId: string;
  deviceId: string;
  shiftId: string;
  employeeId: string;
  tableId: string | null;
  tableName: string | null;
  outletName?: string;
  orderType: string;
  status: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  notes: string | null;
  createdAt: string;
  sourceChannel?: string;
  externalOrderId?: string;
  items: OrderItemResponse[];
};

export type OrderItemResponse = {
  id: string;
  itemId: string;
  itemName: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  status: string;
};

export function listOrders(limit?: number, outletId?: string) {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (outletId) params.append('outletId', outletId);
  const queryString = params.toString();
  return http<OrderResponse[]>(`/api/v1/pos/orders${queryString ? `?${queryString}` : ''}`, {
    method: "GET",
    headers: { ...staffAuthHeader() }
  });
}

export function getOrder(orderId: string) {
  return http<OrderResponse>(`/api/v1/pos/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: { ...staffAuthHeader() }
  });
}

export type OrderCreateInput = {
  orderType: string;
  tableId?: string;
  customerName?: string;
  notes?: string;
};

export function createOrder(input: OrderCreateInput, outletId?: string) {
  const params = new URLSearchParams();
  if (outletId) params.append('outletId', outletId);
  const queryString = params.toString();
  return http<OrderResponse>(`/api/v1/pos/orders${queryString ? `?${queryString}` : ''}`, {
    method: "POST",
    headers: { ...staffAuthHeader() },
    body: JSON.stringify(input)
  });
}

export type OrderAddItemInput = {
  itemId: string;
  qty: number;
};

export function addOrderItem(orderId: string, input: OrderAddItemInput) {
  return http<OrderResponse>(`/api/v1/pos/orders/${encodeURIComponent(orderId)}/items`, {
    method: "POST",
    headers: { ...staffAuthHeader() },
    body: JSON.stringify(input)
  });
}

export function cancelOrderItem(orderId: string, orderItemId: string) {
  return http<OrderResponse>(`/api/v1/pos/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(orderItemId)}`, {
    method: "DELETE",
    headers: { ...staffAuthHeader() }
  });
}

export function markOrderServed(orderId: string) {
  return http<OrderResponse>(`/api/v1/pos/orders/${encodeURIComponent(orderId)}/serve`, {
    method: "POST",
    headers: { ...staffAuthHeader() }
  });
}

export function billOrder(orderId: string) {
  return http<OrderResponse>(`/api/v1/pos/orders/${encodeURIComponent(orderId)}/bill`, {
    method: "POST",
    headers: { ...staffAuthHeader() }
  });
}

export function deleteOrder(orderId: string) {
  return http<void>(`/api/v1/pos/orders/${encodeURIComponent(orderId)}`, {
    method: "DELETE",
    headers: { ...staffAuthHeader() }
  });
}

// Payment APIs
export type PaymentCreateInput = {
  method: string;
  amount: number;
};

export type PaymentResponse = {
  id: string;
  orderId: string;
  method: string;
  amount: number;
  status: string;
};

export function payOrder(orderId: string, input: PaymentCreateInput, idempotencyKey: string) {
  return http<PaymentResponse>(`/api/v1/pos/orders/${encodeURIComponent(orderId)}/payments`, {
    method: "POST",
    headers: {
      ...staffAuthHeader(),
      "Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify(input)
  });
}

export type PaymentLinkResponse = {
  paymentLink: string | null;
};

export function createPaymentLink(orderId: string, idempotencyKey: string) {
  return http<PaymentLinkResponse>(`/api/v1/pos/orders/${encodeURIComponent(orderId)}/payment-link`, {
    method: "POST",
    headers: {
      ...staffAuthHeader(),
      "Idempotency-Key": idempotencyKey
    }
  });
}

export type PaymentStatusResponse = {
  transactionStatus: string;
  orderStatus: string;
};

export function getPaymentStatus(orderId: string) {
  return http<PaymentStatusResponse>(`/api/v1/pos/orders/${encodeURIComponent(orderId)}/payment-status`, {
    method: "GET",
    headers: { ...staffAuthHeader() }
  });
}

// Menu APIs (read-only for staff)
export type MenuItemResponse = {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  status: string;
  images: Array<{ imageUrl: string }>;
};

export type MenuCategoryResponse = {
  id: string;
  name: string;
  displayOrder: number;
};

export function listMenuItems(outletId: string, params?: { status?: string; categoryId?: string }) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
  const queryString = queryParams.toString();
  return http<MenuItemResponse[]>(`/api/v1/admin/outlets/${encodeURIComponent(outletId)}/menu/items${queryString ? `?${queryString}` : ''}`, {
    method: "GET",
    headers: { ...staffAuthHeader() }
  });
}

export function listMenuCategories(outletId: string) {
  return http<MenuCategoryResponse[]>(`/api/v1/admin/outlets/${encodeURIComponent(outletId)}/menu/categories`, {
    method: "GET",
    headers: { ...staffAuthHeader() }
  });
}

// Table APIs (read-only for staff)
export type DiningTableResponse = {
  id: string;
  tableCode: string;
  displayName: string;
  capacity: number;
  status: string;
};

export function listTables(outletId: string) {
  return http<DiningTableResponse[]>(`/api/v1/admin/outlets/${encodeURIComponent(outletId)}/tables`, {
    method: "GET",
    headers: { ...staffAuthHeader() }
  });
}

// Outlet APIs
export type OutletResponse = {
  id: string;
  name: string;
  timezone: string;
  status: string;
};

export function listOutlets() {
  return http<OutletResponse[]>(`/api/v1/admin/outlets`, {
    method: "GET",
    headers: { ...staffAuthHeader() }
  });
}

// Re-export getImageUrl from clientAdmin for consistency
export { getImageUrl } from "./clientAdmin";

// Get current staff info from token
export async function getCurrentStaff() {
  return http<any>(`/api/v1/pos/whoami`, {
    method: "GET",
    headers: { ...staffAuthHeader() }
  });
}
