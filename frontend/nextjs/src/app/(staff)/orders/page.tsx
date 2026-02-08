"use client";

import React, { useMemo, useState, useEffect } from "react";
import styles from "./Orders.module.css";
import Card from "@/components/ui/Card";
import { Plus, Search, ChevronDown, ArrowRight, FileText, X, Timer, CheckCircle2, UtensilsCrossed, Loader2, RefreshCw, Zap, CreditCard, Utensils, Trash2, CheckSquare, Square, ReceiptText, Calendar, LayoutGrid, Kanban as KanbanIcon } from "lucide-react";
import Link from "next/link";
import { listOrders, getOrder, cancelOrderItem, markOrderServed, billOrder, deleteOrder, updateOrderStatus, updateOrderItemStatus, type OrderResponse, type OrderItemResponse } from "@/lib/api/clientAdmin";
import { useOutlet } from "@/contexts/OutletContext";
import { getImageUrl } from "@/lib/api/clientAdmin";
import Image from "next/image";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";

type OrderStatus = "All" | "Preparation" | "Payment" | "Ready" | "Completed" | "Cancelled" | "Open" | "KOT Sent" | "Served" | "Billed" | "Paid";

type Order = {
  id: string;
  type: "Dine In" | "Take Away";
  time: string;
  table: string;
  customer: string;
  status: Exclude<OrderStatus, "All">;
  progress: number;
  itemsCount: number;
  total: number;
  sourceChannel: string;
  externalOrderId: string | null;
  items: { name: string; qty: number; price: number; checked: boolean }[];
};

type DetailItemStatus = "Waiting to cooked" | "Served";

type DetailItem = {
  id: string;
  name: string;
  additions: string;
  note: string;
  price: number;
  qty: number;
  status: DetailItemStatus;
  imageUrl: string | null;
};

// Map backend orderType to frontend display
function mapOrderType(orderType: string): "Dine In" | "Take Away" {
  switch (orderType) {
    case "DINE_IN":
      return "Dine In";
    case "TAKEAWAY":
      return "Take Away";
    case "DELIVERY":
      return "Take Away"; // Map delivery to Take Away for display
    default:
      return "Dine In";
  }
}

// Map backend status to frontend display status
function mapOrderStatus(status: string): Exclude<OrderStatus, "All"> {
  switch (status) {
    case "OPEN":
      return "Open";
    case "KOT_SENT":
      return "KOT Sent";
    case "SERVED":
      return "Served";
    case "BILLED":
      return "Billed";
    case "PAID":
      return "Paid";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Open";
  }
}

// Map display status back to backend status
function mapStatusToBackend(status: Exclude<OrderStatus, "All">): string {
  switch (status) {
    case "Open":
      return "OPEN";
    case "KOT Sent":
      return "KOT_SENT";
    case "Served":
      return "SERVED";
    case "Billed":
      return "BILLED";
    case "Paid":
      return "PAID";
    case "Cancelled":
      return "CANCELLED";
    default:
      return "OPEN";
  }
}

// Calculate progress percentage based on served items
// Calculate progress percentage based on served items and order state
function calculateProgress(items: OrderItemResponse[], orderStatus?: string | null, orderType?: string): number {
  const sStatus = orderStatus ? orderStatus.toUpperCase() : "";

  // Force 100% if the order has reached its final logical state
  if (orderType === "DINE_IN" && sStatus === "PAID") return 100;
  if (orderType === "TAKEAWAY" && sStatus === "SERVED") return 100;

  const activeItems = items.filter((item) => item.status !== "CANCELLED");
  if (activeItems.length === 0) return 0;

  // Count items as "done" if they are Served, Billed, or Paid
  const servedCount = activeItems.filter((item) => {
    const s = item.status ? item.status.toUpperCase() : "";
    return ["SERVED", "BILLED", "PAID"].includes(s);
  }).length;

  return Math.round((servedCount / activeItems.length) * 100);
}

// Format date to display string
function formatOrderTime(dateString: string | null | undefined): string {
  if (!dateString) return "Recent";
  try {
    const date = new Date(dateString);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = days[date.getDay()];
    const month = months[date.getMonth()];
    const dayNum = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${day}, ${dayNum} ${month} ${displayHours}:${displayMinutes} ${ampm}`;
  } catch {
    return "Recent";
  }
}

// Convert backend OrderResponse to frontend Order
function mapOrderResponse(order: OrderResponse): Order {
  const activeItems = order.items.filter((item) => item.status !== "CANCELLED");

  // Pass order status and type to ensure terminal states are handled
  const progress = calculateProgress(order.items, order.status, order.orderType);

  return {
    id: order.id,
    type: mapOrderType(order.orderType),
    time: formatOrderTime(order.createdAt || null),
    table: order.tableId || "N/A",
    customer: "Customer",
    status: mapOrderStatus(order.status),
    progress,
    itemsCount: activeItems.length,
    total: Number(order.grandTotal),
    sourceChannel: (order.sourceChannel || "FOODGRID").toUpperCase(),
    externalOrderId: order.externalOrderId || null,
    items: activeItems.map((item) => ({
      name: item.itemName,
      qty: Number(item.qty),
      price: Number(item.lineTotal),
      checked: item.status === "OPEN", // OPEN items are checked (not served yet)
    })),
  };
}

// Convert OrderItemResponse to DetailItem
function mapOrderItemToDetailItem(item: OrderItemResponse, menuItemImages?: any[]): DetailItem {
  const imageUrl = menuItemImages?.find((img) => img.menuItemId === item.itemId)?.imageUrl || null;

  return {
    id: item.id,
    name: item.itemName,
    additions: "", // Backend doesn't have additions/modifiers yet
    note: "", // Backend doesn't have notes per item yet
    price: Number(item.lineTotal),
    qty: Number(item.qty),
    status: item.status === "SERVED" ? "Served" : "Waiting to cooked",
    imageUrl: imageUrl ? getImageUrl(imageUrl) : null,
  };
}

export default function OrderPage() {
  const [activeStatus, setActiveStatus] = useState<OrderStatus>("All");
  const [timeFilter, setTimeFilter] = useState("Today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("Latest Order");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [selectedOrderResponse, setSelectedOrderResponse] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [activeChannel, setActiveChannel] = useState<string>("All");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("grid");
  const { selectedOutletId } = useOutlet();

  // Fetch orders function
  const fetchOrders = async (isRefresh = false) => {
    if (!selectedOutletId) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Date Range Calculation
      const now = new Date();
      let start: Date | undefined;
      const end: Date = timeFilter === "Custom" && customEndDate ? new Date(customEndDate) : now;

      // Adjust end date to end of day if it's a custom date or today/specific range
      if (timeFilter === "Custom" && customEndDate) {
        end.setHours(23, 59, 59, 999);
      }

      switch (timeFilter) {
        case "Today":
          start = new Date(now);
          start.setHours(0, 0, 0, 0);
          break;
        case "Week":
          start = new Date(now);
          // Start of current week (assuming Monday start)
          const day = start.getDay();
          const diff = start.getDate() - day + (day === 0 ? -6 : 1);
          start.setDate(diff);
          start.setHours(0, 0, 0, 0);
          break;
        case "Month":
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "Quarter":
          const q = Math.floor(now.getMonth() / 3);
          start = new Date(now.getFullYear(), q * 3, 1);
          break;
        case "Year":
          start = new Date(now.getFullYear(), 0, 1);
          break;
        case "All":
          start = new Date("2000-01-01");
          break;
        case "Custom":
          if (customStartDate) {
            start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
          }
          break;
        default:
          start = new Date(now);
          start.setHours(0, 0, 0, 0);
      }

      if (timeFilter === "Custom" && (!start || !end)) {
        // Verify custom dates are valid before fetching
        // If invalid or missing, maybe don't fetch or fetch default?
        // For now, let's just fetch if we have at least start date, or default to today if missing
        if (!start) {
          start = new Date(now);
          start.setHours(0, 0, 0, 0);
        }
      }

      const data = await listOrders(100, selectedOutletId, start?.toISOString(), end.toISOString());
      setOrders(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load orders");
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch orders when outletId is available
  useEffect(() => {
    if (timeFilter === "Custom" && (!customStartDate || !customEndDate)) {
      return; // Wait for both dates
    }
    fetchOrders();
  }, [selectedOutletId, timeFilter, customStartDate, customEndDate]);

  // Auto-refresh when enabled
  useEffect(() => {
    if (!autoRefresh || !selectedOutletId) return;

    const interval = setInterval(() => {
      fetchOrders(true);
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, selectedOutletId]);

  // Fetch order details when selected
  useEffect(() => {
    if (!selectedOrderId) {
      setSelectedOrderResponse(null);
      return;
    }
    const orderId: string = selectedOrderId;
    async function fetchOrderDetails() {
      try {
        const data = await getOrder(orderId);
        setSelectedOrderResponse(data);
      } catch (err: any) {
        console.error("Failed to fetch order details:", err);
        setSelectedOrderResponse(null);
      }
    }
    fetchOrderDetails();
  }, [selectedOrderId]);

  const mappedOrders = useMemo(() => orders.map(mapOrderResponse), [orders]);

  const selectedOrder = useMemo(() => mappedOrders.find((o) => o.id === selectedOrderId) ?? null, [mappedOrders, selectedOrderId]);

  // Centralized filtering logic
  const filteredOrders = useMemo(() => {
    let result = mappedOrders;

    // 1. Search filter
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(o => 
        o.id.toLowerCase().includes(q) || 
        o.customer.toLowerCase().includes(q) ||
        o.table.toLowerCase().includes(q.toLowerCase())
      );
    }

    // 2. Channel filter
    if (activeChannel !== "All") {
      result = result.filter(o => o.sourceChannel === activeChannel.toUpperCase());
    }

    // 3. Status filter (Tab)
    if (activeStatus !== "All") {
      result = result.filter(o => {
        if (activeStatus === "Preparation") {
          return (o.type === "Dine In" && (o.status === "Open" || o.status === "KOT Sent")) ||
            (o.type === "Take Away" && (o.status === "Paid" || o.status === "KOT Sent"));
        }
        if (activeStatus === "Payment") {
          return (o.type === "Dine In" && (o.status === "Served" || o.status === "Billed")) ||
            (o.type === "Take Away" && (o.status === "Open" || o.status === "Billed"));
        }
        if (activeStatus === "Ready") {
          return o.type === "Take Away" && o.status === "Served";
        }
        if (activeStatus === "Completed") {
          return (o.type === "Dine In" && o.status === "Paid") || (o.type === "Take Away" && o.status === "Served");
        }
        return o.status === activeStatus;
      });
    }

    // 4. Sort
    if (sortBy === "Oldest Order") {
      result = [...result].reverse();
    }

    return result;
  }, [mappedOrders, query, activeChannel, activeStatus, sortBy]);

  const statusFilters = useMemo(() => {
    // Counts for status tabs should reflect current Channel and Search Query
    let base = mappedOrders;
    const q = query.trim().toLowerCase();
    if (q) base = base.filter(o => o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q));
    if (activeChannel !== "All") base = base.filter(o => o.sourceChannel === activeChannel.toUpperCase());

    const getCount = (status: string) => {
      let filtered = base;
      if (status === "All") return filtered.length;
      if (status === "Preparation") {
        return filtered.filter(o => 
          (o.type === "Dine In" && (o.status === "Open" || o.status === "KOT Sent")) ||
          (o.type === "Take Away" && (o.status === "Paid" || o.status === "KOT Sent"))
        ).length;
      }
      if (status === "Payment") {
        return filtered.filter(o => 
          (o.type === "Dine In" && (o.status === "Served" || o.status === "Billed")) ||
          (o.type === "Take Away" && (o.status === "Open" || o.status === "Billed"))
        ).length;
      }
      if (status === "Ready") {
        return filtered.filter(o => o.type === "Take Away" && o.status === "Served").length;
      }
      if (status === "Completed") {
        return filtered.filter(o => 
          (o.type === "Dine In" && o.status === "Paid") || (o.type === "Take Away" && o.status === "Served")
        ).length;
      }
      return filtered.filter(o => o.status === status).length;
    };

    return [
      { label: "All Orders", value: "All", count: getCount("All") },
      { label: "Preparation", value: "Preparation", count: getCount("Preparation") },
      { label: "Payment", value: "Payment", count: getCount("Payment") },
      { label: "Ready", value: "Ready", count: getCount("Ready") },
      { label: "Completed", value: "Completed", count: getCount("Completed") },
      { label: "Cancelled", value: "Cancelled", count: getCount("Cancelled") },
    ];
  }, [mappedOrders, query, activeChannel]);

  const channelFilters = useMemo(() => {
    // Counts for channel pills should reflect current Status and Search Query
    let base = mappedOrders;
    const q = query.trim().toLowerCase();
    if (q) base = base.filter(o => o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q));
    
    // Status filtering logic for channel counts
    const filterByStatus = (orders: Order[]) => {
      if (activeStatus === "All") return orders;
      return orders.filter(o => {
        if (activeStatus === "Preparation") {
          return (o.type === "Dine In" && (o.status === "Open" || o.status === "KOT Sent")) ||
            (o.type === "Take Away" && (o.status === "Paid" || o.status === "KOT Sent"));
        }
        if (activeStatus === "Payment") {
          return (o.type === "Dine In" && (o.status === "Served" || o.status === "Billed")) ||
            (o.type === "Take Away" && (o.status === "Open" || o.status === "Billed"));
        }
        if (activeStatus === "Ready") {
          return o.type === "Take Away" && o.status === "Served";
        }
        if (activeStatus === "Completed") {
          return (o.type === "Dine In" && o.status === "Paid") || (o.type === "Take Away" && o.status === "Served");
        }
        return o.status === activeStatus;
      });
    };

    const ordersWithQuery = base;

    return ["All", "FOODGRID", "SWIGGY", "ZOMATO"].map(ch => {
      let filtered = ordersWithQuery;
      if (ch !== "All") {
        filtered = filtered.filter(o => o.sourceChannel === ch);
      }
      return {
        id: ch,
        label: ch === "FOODGRID" ? "FoodGrid" : ch.charAt(0) + ch.slice(1).toLowerCase(),
        count: filterByStatus(filtered).length
      };
    });
  }, [mappedOrders, query, activeStatus]);

  const handleCancelItem = async (orderId: string, orderItemId: string) => {
    if (!selectedOutletId) return;
    try {
      setActionLoading(`cancel-${orderItemId}`);
      await cancelOrderItem(orderId, orderItemId);
      await fetchOrders(true);
      // Refresh selected order if it's the same
      if (selectedOrderId === orderId) {
        const orderData = await getOrder(orderId);
        setSelectedOrderResponse(orderData);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to cancel item");
      console.error("Failed to cancel item:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleItemStatusChange = async (orderId: string, itemId: string, status: string) => {
    if (!selectedOutletId) return;
    try {
      setActionLoading(`item-status-${itemId}`);
      await updateOrderItemStatus(orderId, itemId, status);
      const orderData = await getOrder(orderId);
      setSelectedOrderResponse(orderData);
      await fetchOrders(true);
    } catch (err: any) {
      alert(err?.message || "Failed to update item status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkServed = async (orderId: string) => {
    if (!selectedOutletId) return;
    try {
      setActionLoading(`serve-${orderId}`);
      await markOrderServed(orderId);
      await fetchOrders(true);
      // Refresh selected order if it's the same
      if (selectedOrderId === orderId) {
        const orderData = await getOrder(orderId);
        setSelectedOrderResponse(orderData);
      }
      // Close modal after marking as served
      setSelectedOrderId(null);
    } catch (err: any) {
      alert(err?.message || "Failed to mark order as served");
      console.error("Failed to mark served:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBillOrder = async (orderId: string) => {
    if (!selectedOutletId) return;
    try {
      setActionLoading(`bill-${orderId}`);
      await billOrder(orderId);
      await fetchOrders(true);
      // Refresh selected order if it's the same
      if (selectedOrderId === orderId) {
        const orderData = await getOrder(orderId);
        setSelectedOrderResponse(orderData);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to bill order");
      console.error("Failed to bill order:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Exclude<OrderStatus, "All">) => {
    if (!selectedOutletId) return;
    try {
      setActionLoading(`status-${orderId}`);
      const backendStatus = mapStatusToBackend(newStatus);
      await updateOrderStatus(orderId, backendStatus);
      await fetchOrders(true);
      // Refresh selected order if it's the same
      if (selectedOrderId === orderId) {
        const orderData = await getOrder(orderId);
        setSelectedOrderResponse(orderData);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to update status");
      console.error("Failed to update status:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedOrderIds.size === 0) return;

    try {
      setDeleting(true);
      const deletePromises = Array.from(selectedOrderIds).map((orderId) =>
        deleteOrder(orderId).catch((err) => {
          console.error(`Failed to delete order ${orderId}:`, err);
          return { error: err?.message || "Failed to delete", orderId };
        })
      );

      const results = await Promise.allSettled(deletePromises);
      const errors = results
        .filter((r) => r.status === "rejected" || (r.status === "fulfilled" && r.value && "error" in r.value))
        .map((r, idx) => {
          const orderId = Array.from(selectedOrderIds)[idx];
          if (r.status === "rejected") {
            return { orderId, error: r.reason?.message || "Failed to delete" };
          }
          return r.value as { orderId: string; error: string };
        });

      if (errors.length > 0) {
        const errorMsg = errors.map((e) => `Order ${e.orderId.slice(0, 8)}: ${e.error}`).join("\n");
        alert(`Some orders could not be deleted:\n${errorMsg}`);
      } else {
        // Success - refresh orders
        await fetchOrders(true);
        setSelectedOrderIds(new Set());
        setShowDeleteConfirm(false);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to delete orders");
      console.error("Failed to delete orders:", err);
    } finally {
      setDeleting(false);
    }
  };

  const detailItems = useMemo(() => {
    if (!selectedOrderResponse) return [];
    return selectedOrderResponse.items
      .filter((item) => item.status !== "CANCELLED")
      .map((item) => mapOrderItemToDetailItem(item));
  }, [selectedOrderResponse]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
      }
      // Ctrl/Cmd + R to refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        fetchOrders(true);
      }
      // Escape to close modal
      if (e.key === 'Escape' && selectedOrderId) {
        setSelectedOrderId(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedOrderId]);

  return (
    <div>
      <div className={styles.page} style={{ padding: "24px 32px" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 20 }}>
            <div>
              <h1 style={{
                fontSize: 32,
                fontWeight: 800,
                margin: 0,
                background: "var(--text-primary)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.5px",
              }}>
                Orders
              </h1>
              <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: 15 }}>
                Manage and track all orders in real-time
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              {selectedOrderIds.size > 0 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, var(--danger) 0%, var(--danger) 100%)",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: deleting ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
                    opacity: deleting ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!deleting) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(239, 68, 68, 0.45)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(239, 68, 68, 0.35)";
                  }}
                >
                  {deleting ? (
                    <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Deleting...</>
                  ) : (
                    <><Trash2 size={16} /> Delete ({selectedOrderIds.size})</>
                  )}
                </button>
              )}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: autoRefresh ? "rgba(139, 92, 246, 0.1)" : "white",
                  color: autoRefresh ? "var(--primary)" : "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
                title="Auto-refresh every 10 seconds"
              >
                <Zap size={16} style={{ color: autoRefresh ? "var(--primary)" : "var(--text-secondary)" }} />
                Auto-refresh
              </button>
              <button
                onClick={() => fetchOrders(true)}
                disabled={refreshing}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "var(--bg-surface)",
                  cursor: refreshing ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
                title="Refresh orders (Ctrl+R)"
              >
                <RefreshCw size={16} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
                Refresh
              </button>
              <Link
                href="/client-admin/orders/new"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 20px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(139, 92, 246, 0.35)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(139, 92, 246, 0.35)";
                }}
              >
                <Plus size={18} /> Create New Order
              </Link>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 280, maxWidth: 500 }}>
              <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Order ID or Customer Name (Ctrl+K)"
                style={{
                  width: "100%",
                  padding: "14px 16px 14px 44px",
                  borderRadius: 12,
                  border: "1px solid var(--component-border)",
                  background: "var(--bg-card)",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--component-border)";
                  e.currentTarget.style.background = "var(--bg-secondary)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={{ position: "relative", minWidth: 160 }}>
              <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 36px 14px 16px",
                    borderRadius: 12,
                    border: "1px solid var(--component-border)",
                    fontSize: 14,
                    cursor: "pointer",
                    outline: "none",
                    appearance: "none",
                    boxSizing: "border-box",
                    transition: "all 0.2s ease",
                    background: "var(--bg-card)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--component-border)";
                    e.currentTarget.style.background = "var(--bg-secondary)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <option>Today</option>
                  <option>Week</option>
                  <option>Month</option>
                  <option>Quarter</option>
                  <option>Year</option>
                  <option>All</option>
                  <option>Custom</option>
                </select>
                <Calendar size={16} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-tertiary)" }} />
              </div>
            </div>

            {timeFilter === "Custom" && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{
                    padding: "13px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--component-border)",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "inherit",
                    background: "var(--bg-card)",
                    color: "var(--text-primary)"
                  }}
                />
                <span style={{ color: "var(--text-tertiary)" }}>-</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{
                    padding: "13px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--component-border)",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "inherit",
                    background: "var(--bg-card)",
                    color: "var(--text-primary)"
                  }}
                />
              </div>
            )}

            <div style={{ position: "relative", minWidth: 180 }}>
              <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 36px 14px 16px",
                    borderRadius: 12,
                    border: "1px solid var(--component-border)",
                    fontSize: 14,
                    cursor: "pointer",
                    outline: "none",
                    appearance: "none",
                    boxSizing: "border-box",
                    transition: "all 0.2s ease",
                    background: "var(--bg-card)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--component-border)";
                    e.currentTarget.style.background = "var(--bg-secondary)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <option>Latest Order</option>
                  <option>Oldest Order</option>
                </select>
                <ChevronDown size={16} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-tertiary)" }} />
              </div>
            </div>

            <div className={styles.viewToggle}>
              <button 
                className={clsx(styles.toggleBtn, viewMode === "grid" && styles.toggleBtnActive)}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid size={16} /> Grid
              </button>
              <button 
                className={clsx(styles.toggleBtn, viewMode === "kanban" && styles.toggleBtnActive)}
                onClick={() => setViewMode("kanban")}
              >
                <KanbanIcon size={16} /> Kanban
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          {statusFilters.map((f) => {
            const isActive = f.value === activeStatus;
            const getStatusColor = (label: string) => {
              switch (label) {
                case "Preparation":
                  return { bg: "rgba(59, 130, 246, 0.1)", color: "var(--info)", border: "rgba(59, 130, 246, 0.2)" };
                case "Ready":
                  return { bg: "rgba(16, 185, 129, 0.1)", color: "var(--success)", border: "rgba(16, 185, 129, 0.2)" };
                case "Payment":
                  return { bg: "rgba(245, 158, 11, 0.1)", color: "var(--warning)", border: "rgba(245, 158, 11, 0.2)" };
                case "Completed":
                  return { bg: "rgba(16, 185, 129, 0.1)", color: "var(--success)", border: "rgba(16, 185, 129, 0.2)" };
                case "Cancelled":
                  return { bg: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", border: "rgba(239, 68, 68, 0.2)" };
                default:
                  return { bg: "rgba(100, 116, 139, 0.1)", color: "var(--text-secondary)", border: "rgba(100, 116, 139, 0.2)" };
              }
            };
            const colors = getStatusColor(f.label);

            return (
              <button
                key={f.label}
                onClick={() => setActiveStatus(f.value as any)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 18px",
                  borderRadius: 14,
                  border: `1px solid ${isActive ? colors.border : "rgba(0,0,0,0.08)"}`,
                  background: isActive ? colors.bg : "white",
                  color: isActive ? colors.color : "var(--text-secondary)",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--bg-secondary)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                <span>{f.label}</span>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 28,
                  height: 22,
                  padding: "0 8px",
                  borderRadius: 20,
                  background: isActive ? colors.color : "rgba(100, 116, 139, 0.12)",
                  color: isActive ? "white" : "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {channelFilters.map((f) => {
            const isActive = f.id === activeChannel;
            const colors = {
              All: { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b" },
              FOODGRID: { bg: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" },
              SWIGGY: { bg: "rgba(241, 79, 14, 0.1)", color: "#f14f0e" },
              ZOMATO: { bg: "rgba(235, 34, 49, 0.1)", color: "#eb2231" },
            }[f.id] || { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b" };

            return (
              <button
                key={f.id}
                onClick={() => setActiveChannel(f.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 12,
                  border: `1px solid ${isActive ? colors.color : "rgba(0,0,0,0.05)"}`,
                  background: isActive ? colors.bg : "white",
                  color: colors.color,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
                }}
              >
                {f.label}
                <span style={{ 
                  opacity: 0.6, 
                  fontSize: 11, 
                  background: isActive ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.05)",
                  padding: "1px 6px",
                  borderRadius: 6,
                }}>{f.count}</span>
              </button>
            );
          })}
        </div>

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
            <div style={{ textAlign: "center" }}>
              <Loader2 size={40} className="animate-spin" style={{ color: "var(--primary)", margin: "0 auto 16px" }} />
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Loading orders...</p>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: "16px 20px",
            borderRadius: 12,
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "var(--danger)",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <X size={18} />
            <span style={{ fontWeight: 600 }}>Error: {error}</span>
          </div>
        )}

        {!loading && !error && (
          <div>
            {viewMode === "grid" ? (
              <>
                {filteredOrders.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "12px 16px", background: "var(--bg-surface)", borderRadius: 12, border: "1px solid var(--component-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <button
                      onClick={handleSelectAll}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--component-border)",
                        background: "var(--bg-surface)",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--bg-secondary)";
                        e.currentTarget.style.borderColor = "var(--primary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.borderColor = "var(--component-border)";
                      }}
                    >
                      {selectedOrderIds.size === filteredOrders.length ? (
                        <CheckSquare size={18} style={{ color: "var(--primary)" }} />
                      ) : (
                        <Square size={18} />
                      )}
                      <span>{selectedOrderIds.size === filteredOrders.length ? "Deselect All" : "Select All"}</span>
                    </button>
                    {selectedOrderIds.size > 0 && (
                      <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
                        {selectedOrderIds.size} order{selectedOrderIds.size !== 1 ? "s" : ""} selected
                      </span>
                    )}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 24 }}>
                  {filteredOrders.length === 0 ? (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px", background: "var(--bg-surface)", borderRadius: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                      <FileText size={48} style={{ color: "var(--component-border-hover)", margin: "0 auto 16px" }} />
                      <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px", color: "var(--text-primary)" }}>No orders found</h3>
                      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                        {query || activeStatus !== "All" ? "Try adjusting your search or filter criteria" : "Get started by creating your first order"}
                      </p>
                    </div>
                  ) : (
                    filteredOrders.map((order) => {
                      const isSelected = selectedOrderIds.has(order.id);
                      const getStatusConfig = (status: Exclude<OrderStatus, "All">) => {
                        switch (status) {
                          case "Open":
                          case "KOT Sent":
                            return { bg: "rgba(59, 130, 246, 0.1)", color: "var(--info)", icon: Timer };
                          case "Served":
                            return { bg: "rgba(16, 185, 129, 0.1)", color: "var(--success)", icon: Utensils };
                          case "Billed":
                          case "Paid":
                            return { bg: "rgba(245, 158, 11, 0.1)", color: "var(--warning)", icon: CreditCard };
                          case "Cancelled":
                            return { bg: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", icon: X };
                          default:
                            return { bg: "rgba(100, 116, 139, 0.1)", color: "var(--text-secondary)", icon: FileText };
                        }
                      };
                      const statusConfig = getStatusConfig(order.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <div
                          key={order.id}
                          style={{
                            background: isSelected ? "#fef2f2" : "white",
                            borderRadius: 20,
                            padding: 24,
                            boxShadow: isSelected ? "0 4px 12px rgba(239, 68, 68, 0.15), 0 8px 20px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.04)",
                            border: isSelected ? "2px solid var(--danger)" : "1px solid rgba(0,0,0,0.04)",
                            transition: "all 0.3s ease",
                            cursor: "default",
                            position: "relative",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.transform = "translateY(-4px)";
                              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.08)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.04)";
                            }
                          }}
                        >
                          {/* Checkbox */}
                          <div style={{ position: "absolute", top: 20, right: 20 }}>
                            <button
                              onClick={() => handleToggleSelectOrder(order.id)}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                border: isSelected ? "2px solid var(--danger)" : "2px solid var(--component-border-hover)",
                                background: isSelected ? "var(--danger)" : "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "var(--danger)";
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = "var(--component-border-hover)";
                                }
                              }}
                            >
                              {isSelected && <CheckCircle2 size={16} style={{ color: "white" }} />}
                            </button>
                          </div>
                          {/* Header */}
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                <div style={{
                                  padding: "6px 12px",
                                  borderRadius: 20,
                                  background: statusConfig.bg,
                                  color: statusConfig.color,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}>
                                  <StatusIcon size={14} />
                                  {order.status}
                                </div>
                                <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
                                  {order.type}
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              {order.sourceChannel !== "FOODGRID" && (
                                <div style={{
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  background: order.sourceChannel === "SWIGGY" ? "#f14f0e" : "#eb2231",
                                  color: "white",
                                  fontSize: 10,
                                  fontWeight: 900,
                                  letterSpacing: "0.5px",
                                }}>
                                  {order.sourceChannel}
                                </div>
                              )}
                            </div>
                              </div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                                Order #{order.id.slice(-4).toUpperCase()}
                              </div>
                              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{order.time}</div>
                            </div>
                            
                            <div style={{
                              width: 56,
                              height: 56,
                              borderRadius: 14,
                              background: order.type === "Dine In" ? "linear-gradient(135deg, var(--info) 0%, #2563eb 100%)" : "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: 700,
                              fontSize: 16,
                              flexShrink: 0,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            }}>
                              {order.table === "N/A" ? "TA" : order.table.slice(0, 2)}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div style={{ marginBottom: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Progress</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{order.progress}%</span>
                            </div>
                            <div style={{
                              width: "100%",
                              height: 8,
                              borderRadius: 20,
                              background: "var(--bg-tertiary)",
                              overflow: "hidden",
                            }}>
                              <div style={{
                                width: `${order.progress}%`,
                                height: "100%",
                                backgroundColor: statusConfig.color, 
                                // 2. Add the gradient look using a semi-transparent overlay
                                backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.1) 100%)",
                                transition: "width 0.3s ease",
                              }} />
                            </div>
                          </div>

                          {/* Items Preview */}
                          <div style={{
                            background: "var(--component-bg)",
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 20,
                            border: "1px solid var(--component-border)",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Items ({order.itemsCount})</span>
                              <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>₹{order.total.toFixed(2)}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 120, overflowY: "auto" }}>
                              {order.items.slice(0, 3).map((it, idx) => (
                                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                                    <div style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      // Change this line:
                                      background: it.checked ? "var(--success)" : "var(--info)",
                                      flexShrink: 0,
                                    }} />
                                    <span style={{
                                      fontSize: 20,
                                      fontWeight: 600,
                                      color: "var(--text-primary)",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}>
                                      {it.name}
                                    </span>
                                  </div>
                                  <span style={{ fontWeight: 700, color: "var(--text-secondary)", marginLeft: 8 }}>x{it.qty}</span>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, textAlign: "center", paddingTop: 4 }}>
                                  +{order.items.length - 3} more items
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <button
                              onClick={() => setSelectedOrderId(order.id)}
                              style={{ width: "100%", padding: "12px 18px", borderRadius: 12, border: "1px solid var(--component-border)", background: "var(--bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", transition: "all 0.2s ease" }}
                            >
                              <FileText size={16} /> Order Details
                            </button>
                            <div style={{ display: "flex", gap: 10, width: "100%" }}>
                              {order.type === "Dine In" ? (
                                <>
                                  {order.status === "Open" && (
                                    <button
                                      onClick={() => handleStatusChange(order.id, "KOT Sent")}
                                      disabled={actionLoading === `status-${order.id}`}
                                      style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: "var(--primary)", color: "white", fontWeight: 700, cursor: actionLoading === `status-${order.id}` ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                                    >
                                      {actionLoading === `status-${order.id}` ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                      Kitchen
                                    </button>
                                  )}
                                  {order.status === "KOT Sent" && (
                                    <button
                                      onClick={() => handleMarkServed(order.id)}
                                      disabled={actionLoading === `serve-${order.id}`}
                                      style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: "var(--success)", color: "white", fontWeight: 700, cursor: actionLoading === `serve-${order.id}` ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                                    >
                                      {actionLoading === `serve-${order.id}` ? <Loader2 size={16} className="animate-spin" /> : <Utensils size={16} />}
                                      Serve
                                    </button>
                                  )}
                                  {order.status === "Served" && (
                                    <button
                                      onClick={() => handleBillOrder(order.id)}
                                      disabled={actionLoading === `bill-${order.id}`}
                                      style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: "var(--warning)", color: "white", fontWeight: 700, cursor: actionLoading === `bill-${order.id}` ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                                    >
                                      {actionLoading === `bill-${order.id}` ? <Loader2 size={16} className="animate-spin" /> : <ReceiptText size={16} />}
                                      Bill
                                    </button>
                                  )}
                                  {order.status === "Billed" && (
                                    <Link href={`/client-admin/orders/new?orderId=${order.id}&step=4`} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: "var(--success)", color: "white", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none", fontSize: 13 }}>
                                      <CreditCard size={16} /> Pay
                                    </Link>
                                  )}
                                </>
                              ) : (
                                <>
                                  {order.status === "Open" && (
                                    <button
                                      onClick={() => handleBillOrder(order.id)}
                                      disabled={actionLoading === `bill-${order.id}`}
                                      style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: "var(--warning)", color: "white", fontWeight: 700, cursor: actionLoading === `bill-${order.id}` ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                                    >
                                      {actionLoading === `bill-${order.id}` ? <Loader2 size={16} className="animate-spin" /> : <ReceiptText size={16} />}
                                      Bill
                                    </button>
                                  )}
                                  {order.status === "Billed" && (
                                    <Link href={`/client-admin/orders/new?orderId=${order.id}&step=4`} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: "var(--success)", color: "white", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none", fontSize: 13 }}>
                                      <CreditCard size={16} /> Pay
                                    </Link>
                                  )}
                                  {order.status === "Paid" && (
                                    <button
                                      onClick={() => handleStatusChange(order.id, "KOT Sent")}
                                      disabled={actionLoading === `status-${order.id}`}
                                      style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: "var(--primary)", color: "white", fontWeight: 700, cursor: actionLoading === `status-${order.id}` ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                                    >
                                      {actionLoading === `status-${order.id}` ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                      Kitchen
                                    </button>
                                  )}
                                  {order.status === "KOT Sent" && (
                                    <button
                                      onClick={() => handleMarkServed(order.id)}
                                      disabled={actionLoading === `serve-${order.id}`}
                                      style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: "var(--success)", color: "white", fontWeight: 700, cursor: actionLoading === `serve-${order.id}` ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                                    >
                                      {actionLoading === `serve-${order.id}` ? <Loader2 size={16} className="animate-spin" /> : <Utensils size={16} />}
                                      Pickup
                                    </button>
                                  )}
                                </>
                              )}
                              <div style={{ position: "relative" }}>
                                <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value as any)} style={{ width: 44, height: 44, padding: 0, borderRadius: 12, border: "1px solid var(--component-border)", background: "var(--bg-surface)", fontSize: 0, cursor: "pointer", outline: "none", appearance: "none" }}>
                                  {(["Open", "KOT Sent", "Served", "Billed", "Paid", "Cancelled"] as const).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                                <ChevronDown size={14} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none", color: "var(--text-secondary)" }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <KanbanView 
                orders={filteredOrders} 
                onStatusChange={handleStatusChange} 
                onOrderClick={(id) => setSelectedOrderId(id)}
              />
            )}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 3000,
              padding: 20,
            }}
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          >
            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: 20,
                padding: 32,
                maxWidth: 480,
                width: "100%",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
                  Delete {selectedOrderIds.size} order{selectedOrderIds.size !== 1 ? "s" : ""}?
                </div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  This action cannot be undone. The selected orders will be permanently deleted.
                  {selectedOrderIds.size > 1 && " Orders with payments cannot be deleted."}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  style={{
                    padding: "12px 24px",
                    borderRadius: 12,
                    border: "1px solid var(--border-light)",
                    background: "var(--bg-primary)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    cursor: deleting ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!deleting) {
                      e.currentTarget.style.background = "var(--bg-secondary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  style={{
                    padding: "12px 24px",
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, var(--danger) 0%, var(--danger) 100%)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "white",
                    cursor: deleting ? "not-allowed" : "pointer",
                    opacity: deleting ? 0.6 : 1,
                    transition: "all 0.2s ease",
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    if (!deleting) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(239, 68, 68, 0.45)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(239, 68, 68, 0.35)";
                  }}
                >
                  {deleting ? (
                    <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Deleting...</>
                  ) : (
                    <><Trash2 size={16} /> Delete</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedOrder && selectedOrderResponse && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2000,
              padding: 20,
              animation: "fadeIn 0.2s ease",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Detail Order"
            onMouseDown={() => setSelectedOrderId(null)}
          >
            <div
              style={{
                width: "min(600px, 95vw)",
                maxHeight: "min(90vh, 900px)",
                background: "var(--bg-surface)",
                borderRadius: 24,
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                border: "1px solid rgba(0,0,0,0.08)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                animation: "slideUp 0.3s ease",
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div style={{
                padding: "24px 28px",
                borderBottom: "1px solid var(--bg-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)",
              }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>Order Details</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Order #{selectedOrder.id.slice(-4).toUpperCase()}</div>
                </div>
                <button
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "#111827",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    border: "none",
                    transition: "all 0.2s ease",
                  }}
                  aria-label="Close"
                  onClick={() => setSelectedOrderId(null)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#374151";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#111827";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{
                padding: "24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                overflow: "auto",
                flex: 1,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: "1px solid var(--bg-tertiary)" }}>
                  <div>
                    <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>Order Type</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{selectedOrder.type}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>Time</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{selectedOrder.time}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: selectedOrder.type === "Dine In" ? "linear-gradient(135deg, var(--info) 0%, #2563eb 100%)" : "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 18,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}>
                    {selectedOrder.table === "N/A" ? "TA" : selectedOrder.table.slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>Table</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{selectedOrder.table}</div>
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  borderRadius: 14,
                  background: "var(--component-bg)",
                  border: "1px solid var(--component-border)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: `conic-gradient(var(--success) ${selectedOrder.progress * 3.6}deg, var(--component-border) 0deg)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}>
                      <div style={{
                        position: "absolute",
                        inset: 4,
                        borderRadius: "50%",
                        background: "var(--bg-surface)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--success)",
                      }}>
                        {selectedOrder.progress}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{selectedOrder.status}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{selectedOrder.itemsCount} items</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {detailItems.map((it) => (
                    <div
                      key={it.id}
                      style={{
                        borderRadius: 16,
                        border: "1px solid var(--component-border)",
                        overflow: "hidden",
                        background: "var(--bg-surface)",
                      }}
                    >
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        background: it.status === "Served" ? "linear-gradient(180deg, rgba(16, 185, 129, 0.12), rgba(var(--bg-surface-rgb), 0))" : "linear-gradient(180deg, rgba(59, 130, 246, 0.08), rgba(var(--bg-surface-rgb), 0))",
                      }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, color: it.status === "Served" ? "var(--success)" : "var(--info)" }}>
                          {it.status === "Served" ? <CheckCircle2 size={18} /> : <Timer size={18} />}
                          <span>{it.status}</span>
                        </div>
                        {it.status === "Waiting to cooked" && (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => handleItemStatusChange(selectedOrder.id, it.id, "SERVED")}
                              disabled={actionLoading === `item-status-${it.id}`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 12px",
                                borderRadius: 20,
                                border: "1px solid rgba(16, 185, 129, 0.35)",
                                color: "rgba(16, 185, 129, 0.95)",
                                background: "rgba(16, 185, 129, 0.06)",
                                fontWeight: 700,
                                fontSize: 12,
                                cursor: actionLoading === `item-status-${it.id}` ? "not-allowed" : "pointer",
                                opacity: actionLoading === `item-status-${it.id}` ? 0.6 : 1,
                                transition: "all 0.2s ease",
                              }}
                            >
                              {actionLoading === `item-status-${it.id}` ? (
                                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                              ) : (
                                <><Utensils size={14} /> Serve</>
                              )}
                            </button>
                            <button
                              onClick={() => handleCancelItem(selectedOrder.id, it.id)}
                              disabled={actionLoading === `cancel-${it.id}`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 12px",
                                borderRadius: 20,
                                border: "1px solid rgba(239, 68, 68, 0.35)",
                                color: "rgba(239, 68, 68, 0.95)",
                                background: "rgba(239, 68, 68, 0.06)",
                                fontWeight: 700,
                                fontSize: 12,
                                cursor: actionLoading === `cancel-${it.id}` ? "not-allowed" : "pointer",
                                opacity: actionLoading === `cancel-${it.id}` ? 0.6 : 1,
                                transition: "all 0.2s ease",
                              }}
                            >
                              {actionLoading === `cancel-${it.id}` ? (
                                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                              ) : (
                                <><UtensilsCrossed size={14} /> Cancel</>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 16, padding: 16 }}>
                        {it.imageUrl ? (
                          <Image
                            src={it.imageUrl}
                            alt={it.name}
                            width={80}
                            height={80}
                            style={{ objectFit: "cover", borderRadius: 12, border: "1px solid var(--component-border)" }}
                          />
                        ) : (
                          <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: 12,
                            background: "var(--bg-tertiary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text-tertiary)",
                            fontSize: 11,
                            fontWeight: 600,
                            border: "1px solid var(--component-border)",
                          }}>
                            No Image
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{it.name}</div>
                          {it.additions && <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 2 }}>{it.additions}</div>}
                          {it.note && <div style={{ fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic" }}>Note: {it.note}</div>}
                        </div>
                      </div>

                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderTop: "1px solid var(--bg-tertiary)",
                        background: "var(--component-bg)",
                      }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>₹{it.price.toFixed(2)}</div>
                        <div style={{
                          padding: "6px 12px",
                          borderRadius: 20,
                          border: "1px solid var(--component-border)",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--text-secondary)",
                          background: "var(--bg-surface)",
                        }}>
                          x{it.qty}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                borderTop: "1px solid var(--bg-tertiary)",
                padding: "20px 28px 28px",
                background: "linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                  paddingBottom: 16,
                  borderBottom: "1px solid var(--component-border)",
                }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)" }}>Total Payment</span>
                  <span style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>₹{selectedOrder.total.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <Link
                    href={`/client-admin/orders/new?orderId=${selectedOrder.id}`}
                    style={{
                      flex: 1,
                      padding: "14px 20px",
                      borderRadius: 12,
                      border: "1px solid var(--component-border)",
                      background: "var(--bg-surface)",
                      fontSize: 14,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      textDecoration: "none",
                      color: "var(--text-secondary)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--component-border-hover)";
                      e.currentTarget.style.background = "var(--bg-secondary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--component-border)";
                      e.currentTarget.style.background = "white";
                    }}
                  >
                    <Plus size={18} /> Add Items
                  </Link>
                  {/* Dynamically show buttons based on Order Flow */}
                  {selectedOrder.type === "Dine In" ? (
                    <>
                      {/* DINE_IN Flow: OPEN -> KOT_SENT -> SERVED -> BILLED -> PAID */}
                      {selectedOrder.status === "Open" && (
                        <button
                          onClick={() => handleStatusChange(selectedOrder.id, "KOT Sent")}
                          disabled={actionLoading === `status-${selectedOrder.id}`}
                          className={styles.primaryActionBtn}
                          style={{ background: "var(--primary)", cursor: actionLoading === `status-${selectedOrder.id}` ? "not-allowed" : "pointer" }}
                        >
                          {actionLoading === `status-${selectedOrder.id}` ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                          Send to Kitchen
                        </button>
                      )}
                      {selectedOrder.status === "KOT Sent" && (
                        <button
                          onClick={() => handleMarkServed(selectedOrder.id)}
                          disabled={actionLoading === `serve-${selectedOrder.id}`}
                          className={styles.primaryActionBtn}
                          style={{ cursor: actionLoading === `serve-${selectedOrder.id}` ? "not-allowed" : "pointer" }}
                        >
                          {actionLoading === `serve-${selectedOrder.id}` ? <Loader2 size={18} className="animate-spin" /> : <Utensils size={18} />}
                          Mark as Served
                        </button>
                      )}
                      {selectedOrder.status === "Served" && (
                        <button
                          onClick={() => handleBillOrder(selectedOrder.id)}
                          disabled={actionLoading === `bill-${selectedOrder.id}`}
                          className={styles.primaryActionBtn}
                          style={{ background: "var(--warning)", cursor: actionLoading === `bill-${selectedOrder.id}` ? "not-allowed" : "pointer" }}
                        >
                          {actionLoading === `bill-${selectedOrder.id}` ? <Loader2 size={18} className="animate-spin" /> : <ReceiptText size={18} />}
                          Generate Bill
                        </button>
                      )}
                      {selectedOrder.status === "Billed" && (
                        <Link
                          href={`/client-admin/orders/new?orderId=${selectedOrder.id}&step=4`}
                          className={styles.primaryActionBtn}
                          style={{ background: "var(--success)", textDecoration: "none" }}
                        >
                          <CreditCard size={18} /> Proceed to Payment
                        </Link>
                      )}
                    </>
                  ) : (
                    <>
                      {/* TAKEAWAY Flow: OPEN -> BILLED -> PAID -> KOT_SENT -> SERVED */}
                      {selectedOrder.status === "Open" && (
                        <button
                          onClick={() => handleBillOrder(selectedOrder.id)}
                          disabled={actionLoading === `bill-${selectedOrder.id}`}
                          className={styles.primaryActionBtn}
                          style={{ background: "var(--warning)", cursor: actionLoading === `bill-${selectedOrder.id}` ? "not-allowed" : "pointer" }}
                        >
                          {actionLoading === `bill-${selectedOrder.id}` ? <Loader2 size={18} className="animate-spin" /> : <ReceiptText size={18} />}
                          Generate Bill
                        </button>
                      )}
                      {selectedOrder.status === "Billed" && (
                        <Link
                          href={`/client-admin/orders/new?orderId=${selectedOrder.id}&step=4`}
                          className={styles.primaryActionBtn}
                          style={{ background: "var(--success)", textDecoration: "none" }}
                        >
                          <CreditCard size={18} /> Proceed to Payment
                        </Link>
                      )}
                      {selectedOrder.status === "Paid" && (
                        <button
                          onClick={() => handleStatusChange(selectedOrder.id, "KOT Sent")}
                          disabled={actionLoading === `status-${selectedOrder.id}`}
                          className={styles.primaryActionBtn}
                          style={{ background: "var(--primary)", cursor: actionLoading === `status-${selectedOrder.id}` ? "not-allowed" : "pointer" }}
                        >
                          {actionLoading === `status-${selectedOrder.id}` ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                          Send to Kitchen
                        </button>
                      )}
                      {selectedOrder.status === "KOT Sent" && (
                        <button
                          onClick={() => handleMarkServed(selectedOrder.id)}
                          disabled={actionLoading === `serve-${selectedOrder.id}`}
                          className={styles.primaryActionBtn}
                          style={{ cursor: actionLoading === `serve-${selectedOrder.id}` ? "not-allowed" : "pointer" }}
                        >
                          {actionLoading === `serve-${selectedOrder.id}` ? <Loader2 size={18} className="animate-spin" /> : <Utensils size={18} />}
                          Ready for Pickup
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const KANBAN_COLUMNS: { id: Exclude<OrderStatus, "All">; label: string; icon: any }[] = [
  { id: "Open", label: "Incoming", icon: FileText },
  { id: "KOT Sent", label: "Kitchen", icon: Zap },
  { id: "Served", label: "Ready / Served", icon: Utensils },
  { id: "Billed", label: "Billed", icon: ReceiptText },
  { id: "Paid", label: "Completed", icon: CheckCircle2 },
];

function KanbanView({ orders, onStatusChange, onOrderClick }: { orders: Order[], onStatusChange: (id: string, s: any) => void, onOrderClick: (id: string) => void }) {
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    onStatusChange(draggableId, destination.droppableId as any);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={styles.kanbanContainer}>
        {KANBAN_COLUMNS.map((col) => (
          <div key={col.id} className={styles.kanbanColumn}>
            <div className={styles.kanbanColumnHeader}>
              <h3>
                <col.icon size={16} />
                {col.label}
              </h3>
              <span className={styles.columnCount}>
                {orders.filter(o => o.status === col.id).length}
              </span>
            </div>
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={styles.kanbanList}
                  style={{
                    background: snapshot.isDraggingOver ? "rgba(224, 211, 255, 0.61)" : "transparent",
                    transition: "background 0.2s ease"
                  }}
                >
                  <AnimatePresence>
                    {orders
                      .filter((o) => o.status === col.id)
                      .map((order, index) => (
                        <Draggable key={order.id} draggableId={order.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`${styles.kanbanCard} ${snapshot.isDragging ? styles.kanbanCardDragging : ""}`}
                              onClick={() => onOrderClick(order.id)}
                            >
                              <motion.div 
                                layoutId={order.id}
                                className={styles.kanbanCardContent}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                              >
                                <div className={styles.cardHeader}>
                                  <span className={styles.orderId}>#{order.id.slice(-4).toUpperCase()}</span>
                                  <span className={styles.timeText}>{order.time.split(' ').slice(-2).join(' ')}</span>
                                </div>
                                <div className={styles.cardTitle}>{order.type} - {order.table}</div>
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
                                  {order.items.slice(0, 5).map((it, i) => (
                                    <span key={i} style={{ fontSize: 20, color: "var(--text-secondary)", background: "var(--bg-tertiary)", padding: "2px 6px", borderRadius: 4 }}>
                                      {it.qty}x {it.name}
                                    </span>
                                  ))}
                                  {order.items.length > 5 && <span style={{ fontSize: 16, color: "var(--text-tertiary)" }}>+{order.items.length - 5} more</span>}
                                </div>
                                <div className={styles.cardFooter}>
                                  <span className={styles.priceTag}>₹{order.total.toFixed(0)}</span>
                                  <span className={styles.tableTag}>{order.table}</span>
                                </div>
                              </motion.div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                  </AnimatePresence>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

function clsx(...args: any[]) {
  return args.filter(Boolean).join(" ");
}
