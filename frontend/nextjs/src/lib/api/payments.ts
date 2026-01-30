import { PaginatedResponse } from "./common";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

function clientAdminAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("fg_client_admin_access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...clientAdminAuthHeader(),
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

export type GatewayTransactionResponse = {
  id: string;
  orderId: string;
  paymentId: string | null;
  gatewayType: string;
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  amount: number;
  currency: string;
  status: 'INITIATED' | 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'VOIDED';
  paymentMethod: string | null;
  failureReason: string | null;
  createdAt: string; // ISO string
  completedAt: string | null; // ISO string
};

export type ListTransactionsParams = {
  page?: number;
  size?: number;
  status?: string;
  paymentMethod?: string;
  fromDate?: string; // ISO string
  toDate?: string; // ISO string
};

export function listClientTransactions(params: ListTransactionsParams) {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', params.page.toString());
  if (params.size !== undefined) searchParams.set('size', params.size.toString());
  if (params.status && params.status !== 'All') searchParams.set('status', params.status);
  if (params.paymentMethod && params.paymentMethod !== 'All') searchParams.set('paymentMethod', params.paymentMethod);
  if (params.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params.toDate) searchParams.set('toDate', params.toDate);
  
  const query = searchParams.toString();
  
  return http<PaginatedResponse<GatewayTransactionResponse>>(
    `/api/v1/payments/client${query ? `?${query}` : ''}`,
    {
      method: "GET"
    }
  );
}
