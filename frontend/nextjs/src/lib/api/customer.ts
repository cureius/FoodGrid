/**
 * Customer-facing API service layer
 * Refactored to use centralized Axios api client for automated token management
 */

import api from '@/lib/axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

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
  id: string;
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
// Restaurant / Outlet APIs (Public/Customer)
// ─────────────────────────────────────────────────────────────

export async function getOutlet(outletId: string): Promise<Outlet> {
  const { data } = await api.get<Outlet>(`/api/v1/customer/outlets/${encodeURIComponent(outletId)}`);
  return data;
}

export async function listOutlets(): Promise<Outlet[]> {
  const { data } = await api.get<Outlet[]>(`/api/v1/customer/outlets`);
  return data;
}

// ─────────────────────────────────────────────────────────────
// Menu APIs (Public/Customer)
// ─────────────────────────────────────────────────────────────

export async function getMenuCategories(outletId: string): Promise<MenuCategory[]> {
  const { data } = await api.get<MenuCategory[]>(
    `/api/v1/customer/outlets/${encodeURIComponent(outletId)}/menu/categories`
  );
  return data;
}

export async function getMenuItems(
  outletId: string,
  params?: { categoryId?: string; status?: string }
): Promise<MenuItem[]> {
  const { data } = await api.get<MenuItem[]>(
    `/api/v1/customer/outlets/${encodeURIComponent(outletId)}/menu/items`,
    { params }
  );
  return data;
}

export async function getMenuItem(outletId: string, itemId: string): Promise<MenuItem> {
  // Directly fetching items for now, but in future might need single item API
  const items = await getMenuItems(outletId);
  const item = items.find(i => i.id === itemId);
  if (!item) throw new Error('Item not found');
  return item;
}

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
// Order APIs (Authenticated - RolesAllowed: CUSTOMER)
// ─────────────────────────────────────────────────────────────

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { data } = await api.post<Order>(`/api/v1/customer/orders?outletId=${encodeURIComponent(input.outletId)}`, {
    orderType: input.orderType,
    tableId: input.tableId,
    customerName: input.customerName,
    notes: input.notes,
    items: input.items
  });
  return data;
}

export async function getOrder(orderId: string): Promise<Order> {
  const { data } = await api.get<Order>(`/api/v1/customer/orders/${encodeURIComponent(orderId)}`);
  return data;
}

export async function listOrders(limit?: number, outletId?: string): Promise<Order[]> {
  const { data } = await api.get<Order[]>(`/api/v1/customer/orders`, {
    params: { limit, outletId }
  });
  return data;
}

// ─────────────────────────────────────────────────────────────
// Payment APIs (Partially Public / Partially Authenticated)
// ─────────────────────────────────────────────────────────────

export async function getPaymentStatus(orderId: string): Promise<PaymentStatus> {
  const { data } = await api.get<PaymentStatus>(`/api/v1/customer/payments/order/${encodeURIComponent(orderId)}/status`);
  return data;
}

export async function getOrderPayment(orderId: string): Promise<PaymentInfo> {
  const { data } = await api.get<PaymentInfo>(`/api/v1/customer/payments/order/${encodeURIComponent(orderId)}`);
  return data;
}

export async function createPaymentLink(orderId: string): Promise<PaymentInfo> {
  const { data } = await api.post<PaymentInfo>(`/api/v1/customer/payments/order/${encodeURIComponent(orderId)}/link`);
  return data;
}

export async function verifyPayment(params: {
  transactionId: string;
  gatewayPaymentId: string;
  gatewaySignature: string;
  gatewayOrderId: string;
  additionalData?: Record<string, string>;
}): Promise<{ success: boolean; status: string }> {
  const { data } = await api.post(`/api/v1/public/payments/verify`, params);
  return data;
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

export function calculateCartTotal(items: CartItem[]): {
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxRate = 0.05; 
  const taxAmount = subtotal * taxRate;
  const deliveryFee = 0; 
  const discount = 0; 
  const total = subtotal + taxAmount + deliveryFee - discount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    deliveryFee,
    discount,
    total: Math.round(total * 100) / 100,
  };
}

export function formatPrice(price: number, currency: string = '₹'): string {
  return `${currency}${price.toFixed(2)}`;
}

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
