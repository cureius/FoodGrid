/**
 * Customer-facing API service layer
 * All API calls for the user/customer frontend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

// ─────────────────────────────────────────────────────────────
// HTTP Utilities
// ─────────────────────────────────────────────────────────────

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
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

/**
 * Converts a relative file path to an absolute URL
 */
export function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  if (imagePath.startsWith('/')) {
    return `${API_BASE}${imagePath}`;
  }
  
  return `${API_BASE}/${imagePath}`;
}

// ─────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────

export interface Outlet {
  id: string;
  name: string;
  timezone: string;
  ownerId: string;
  status: 'ACTIVE' | 'INACTIVE';
  // Extended restaurant info (if available)
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  cuisines?: string[];
  rating?: number;
  reviewCount?: number;
  deliveryTime?: string;
  minimumOrder?: number;
  deliveryFee?: number;
  isOpen?: boolean;
  openingHours?: string;
  bannerUrl?: string;
  logoUrl?: string;
}

export interface MenuCategory {
  id: string;
  outletId: string;
  name: string;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
  imageUrl?: string;
  itemCount?: number;
}

export interface MenuItemImage {
  id: string;
  imageUrl: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface MenuItem {
  id: string;
  outletId: string;
  categoryId: string | null;
  categoryName: string | null;
  name: string;
  description: string | null;
  isVeg: boolean;
  basePrice: number;
  status: 'ACTIVE' | 'INACTIVE';
  images: MenuItemImage[];
  primaryImageUrl: string | null;
  // Extended fields
  isBestseller?: boolean;
  isPopular?: boolean;
  isAvailable?: boolean;
  customizations?: MenuItemCustomization[];
  addons?: MenuItemAddon[];
}

export interface MenuItemCustomization {
  id: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: CustomizationOption[];
}

export interface CustomizationOption {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
}

export interface MenuItemAddon {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
}

export interface CartItem {
  id: string; // unique cart item id
  menuItem: MenuItem;
  quantity: number;
  customizations?: SelectedCustomization[];
  addons?: SelectedAddon[];
  specialInstructions?: string;
  unitPrice: number;
  totalPrice: number;
}

export interface SelectedCustomization {
  customizationId: string;
  customizationName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface SelectedAddon {
  addonId: string;
  addonName: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  outletId: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  status: OrderStatus;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  tableId?: string;
  tableCode?: string;
}

export type OrderStatus = 
  | 'OPEN' 
  | 'PLACED'
  | 'ACCEPTED' 
  | 'PREPARING' 
  | 'READY' 
  | 'SERVED' 
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'BILLED' 
  | 'PAID' 
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  itemId: string;
  itemName: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  status: 'OPEN' | 'CANCELLED';
  customizations?: string;
  specialInstructions?: string;
}

export interface PaymentInfo {
  transactionId: string;
  orderId: string;
  gatewayType: string;
  gatewayOrderId: string;
  paymentLink: string | null;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentStatus {
  orderId: string;
  transactionId: string | null;
  gatewayType: string | null;
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  transactionStatus: string;
  orderStatus: string;
  amount: number;
}

export interface Address {
  id: string;
  label: string;
  fullAddress: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface CreateOrderInput {
  outletId: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableId?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  notes?: string;
  items: CreateOrderItemInput[];
}

export interface CreateOrderItemInput {
  itemId: string;
  qty: number;
  customizations?: string;
  specialInstructions?: string;
}

// ─────────────────────────────────────────────────────────────
// Restaurant / Outlet APIs
// ─────────────────────────────────────────────────────────────

/**
 * Get restaurant/outlet details (public endpoint)
 */
export async function getOutlet(outletId: string): Promise<Outlet> {
  return http<Outlet>(`/api/v1/public/outlets/${encodeURIComponent(outletId)}`);
}

/**
 * List available outlets (for multi-outlet scenarios)
 */
export async function listOutlets(): Promise<Outlet[]> {
  return http<Outlet[]>(`/api/v1/public/outlets`);
}

// ─────────────────────────────────────────────────────────────
// Menu APIs (Public)
// ─────────────────────────────────────────────────────────────

/**
 * Get all menu categories for an outlet
 */
export async function getMenuCategories(outletId: string): Promise<MenuCategory[]> {
  return http<MenuCategory[]>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/menu/categories`
  );
}

/**
 * Get all menu items for an outlet
 */
export async function getMenuItems(
  outletId: string,
  params?: { categoryId?: string; status?: string }
): Promise<MenuItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params?.status) searchParams.set('status', params.status);
  const query = searchParams.toString();

  return http<MenuItem[]>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/menu/items${query ? `?${query}` : ''}`
  );
}

/**
 * Get a specific menu item with full details
 */
export async function getMenuItem(outletId: string, itemId: string): Promise<MenuItem> {
  return http<MenuItem>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/menu/items/${encodeURIComponent(itemId)}`
  );
}

/**
 * Search menu items by name
 */
export async function searchMenuItems(outletId: string, query: string): Promise<MenuItem[]> {
  const items = await getMenuItems(outletId, { status: 'ACTIVE' });
  const lowerQuery = query.toLowerCase();
  return items.filter(
    item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery) ||
      item.categoryName?.toLowerCase().includes(lowerQuery)
  );
}

// ─────────────────────────────────────────────────────────────
// Order APIs (Customer)
// ─────────────────────────────────────────────────────────────

/**
 * Create a new order (for guest checkout)
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  // For customer orders, we'll need a public endpoint
  // Using the existing POS endpoint structure for now
  return http<Order>(`/api/v1/pos/orders?outletId=${encodeURIComponent(input.outletId)}`, {
    method: 'POST',
    body: JSON.stringify({
      orderType: input.orderType,
      tableId: input.tableId,
      customerName: input.customerName,
      notes: input.notes,
    }),
  });
}

/**
 * Add item to an existing order
 */
export async function addOrderItem(
  orderId: string,
  itemId: string,
  qty: number
): Promise<Order> {
  return http<Order>(`/api/v1/pos/orders/${encodeURIComponent(orderId)}/items`, {
    method: 'POST',
    body: JSON.stringify({ itemId, qty }),
  });
}

/**
 * Get order details
 */
export async function getOrder(orderId: string): Promise<Order> {
  return http<Order>(`/api/v1/pos/orders/${encodeURIComponent(orderId)}`);
}

/**
 * Get order payment status (public endpoint)
 */
export async function getPaymentStatus(orderId: string): Promise<PaymentStatus> {
  return http<PaymentStatus>(`/api/v1/public/payments/order/${encodeURIComponent(orderId)}/status`);
}

/**
 * Get payment info for an order
 */
export async function getOrderPayment(orderId: string): Promise<PaymentInfo> {
  return http<PaymentInfo>(`/api/v1/public/payments/order/${encodeURIComponent(orderId)}`);
}

/**
 * Create payment link for an order
 */
export async function createPaymentLink(orderId: string): Promise<PaymentInfo> {
  return http<PaymentInfo>(`/api/v1/payments/order/${encodeURIComponent(orderId)}/link`, {
    method: 'POST',
  });
}

/**
 * Verify payment after completion
 */
export async function verifyPayment(params: {
  transactionId: string;
  gatewayPaymentId: string;
  gatewaySignature: string;
  gatewayOrderId: string;
  additionalData?: Record<string, string>;
}): Promise<{ success: boolean; status: string }> {
  return http(`/api/v1/public/payments/verify`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * List orders for a customer/outlet
 */
export async function listOrders(limit?: number, outletId?: string): Promise<Order[]> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (outletId) params.append('outletId', outletId);
  const queryString = params.toString();
  return http<Order[]>(`/api/v1/pos/orders${queryString ? `?${queryString}` : ''}`);
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

/**
 * Calculate cart total
 */
export function calculateCartTotal(items: CartItem[]): {
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxRate = 0.05; // 5% GST - adjust based on backend config
  const taxAmount = subtotal * taxRate;
  const deliveryFee = 0; // To be fetched from outlet config
  const discount = 0; // To be calculated based on coupons
  const total = subtotal + taxAmount + deliveryFee - discount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    deliveryFee,
    discount,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Format price with currency
 */
export function formatPrice(price: number, currency: string = '₹'): string {
  return `${currency}${price.toFixed(2)}`;
}

/**
 * Get order status display info
 */
export function getOrderStatusInfo(status: OrderStatus): {
  label: string;
  color: string;
  bgColor: string;
  step: number;
} {
  const statusMap: Record<OrderStatus, { label: string; color: string; bgColor: string; step: number }> = {
    OPEN: { label: 'Order Placed', color: '#6B7280', bgColor: '#F3F4F6', step: 0 },
    PLACED: { label: 'Order Placed', color: '#4B70F5', bgColor: '#EEF2FE', step: 1 },
    ACCEPTED: { label: 'Accepted', color: '#4B70F5', bgColor: '#EEF2FE', step: 2 },
    PREPARING: { label: 'Preparing', color: '#F69B42', bgColor: '#FEF3E2', step: 3 },
    READY: { label: 'Ready', color: '#10B981', bgColor: '#D1FAE5', step: 4 },
    SERVED: { label: 'Served', color: '#10B981', bgColor: '#D1FAE5', step: 5 },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#F69B42', bgColor: '#FEF3E2', step: 4 },
    DELIVERED: { label: 'Delivered', color: '#10B981', bgColor: '#D1FAE5', step: 5 },
    BILLED: { label: 'Billed', color: '#6B7280', bgColor: '#F3F4F6', step: 5 },
    PAID: { label: 'Paid', color: '#10B981', bgColor: '#D1FAE5', step: 6 },
    CANCELLED: { label: 'Cancelled', color: '#EF4444', bgColor: '#FEE2E2', step: -1 },
  };

  return statusMap[status] || statusMap.OPEN;
}
