"use client";

import React, { useMemo, useState, useEffect } from "react";
import styles from "./Orders.module.css";
import Card from "@/components/ui/Card";
import { Plus, Search, ChevronDown, ArrowRight, FileText, X, Timer, CheckCircle2, UtensilsCrossed, Loader2, RefreshCw, Zap, CreditCard, Utensils, Trash2, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import { listOrders, getOrder, cancelOrderItem, markOrderServed, billOrder, deleteOrder, type OrderResponse, type OrderItemResponse } from "@/lib/api/clientAdmin";
import { useOutlet } from "@/contexts/OutletContext";
import { getImageUrl } from "@/lib/api/clientAdmin";
import Image from "next/image";

type OrderStatus = "All" | "In Progress" | "Ready to Served" | "Waiting for Payment";

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
    case "KOT_SENT":
      return "In Progress";
    case "SERVED":
      return "Ready to Served";
    case "BILLED":
      return "Waiting for Payment";
    case "PAID":
      return "Waiting for Payment"; // Already paid, but show as waiting for payment
    case "CANCELLED":
      return "In Progress"; // Show cancelled orders as in progress for now
    default:
      return "In Progress";
  }
}

// Calculate progress percentage based on served items
function calculateProgress(items: OrderItemResponse[]): number {
  if (items.length === 0) return 0;
  const servedCount = items.filter((item) => item.status === "OPEN").length; // Items that are OPEN are not yet served
  const totalCount = items.length;
  // Progress is inverse: more OPEN items = less progress
  return Math.round(((totalCount - servedCount) / totalCount) * 100);
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
  const servedItems = order.items.filter((item) => item.status !== "CANCELLED");
  const progress = calculateProgress(servedItems);

  return {
    id: order.id,
    type: mapOrderType(order.orderType),
    time: formatOrderTime(order.createdAt || null),
    table: order.tableId || "N/A",
    customer: "Customer", // Placeholder - backend doesn't have customer name
    status: mapOrderStatus(order.status),
    progress,
    itemsCount: servedItems.length,
    total: Number(order.grandTotal),
    items: servedItems.map((item) => ({
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
    status: item.status === "OPEN" ? "Waiting to cooked" : "Served",
    imageUrl: imageUrl ? getImageUrl(imageUrl) : null,
  };
}

export default function OrderPage() {
  const [activeStatus, setActiveStatus] = useState<OrderStatus>("All");
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      const data = await listOrders(100, selectedOutletId);
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
    fetchOrders();
  }, [selectedOutletId]);

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

  const statusFilters: { label: OrderStatus; count: number }[] = useMemo(() => {
    const counts = {
      All: mappedOrders.length,
      "In Progress": mappedOrders.filter((o) => o.status === "In Progress").length,
      "Ready to Served": mappedOrders.filter((o) => o.status === "Ready to Served").length,
      "Waiting for Payment": mappedOrders.filter((o) => o.status === "Waiting for Payment").length,
    };
    return [
      { label: "All", count: counts.All },
      { label: "In Progress", count: counts["In Progress"] },
      { label: "Ready to Served", count: counts["Ready to Served"] },
      { label: "Waiting for Payment", count: counts["Waiting for Payment"] },
    ];
  }, [mappedOrders]);

  const filteredOrders = useMemo(() => {
    let filtered = mappedOrders;

    // Filter by status
    if (activeStatus !== "All") {
      filtered = filtered.filter((o) => o.status === activeStatus);
    }

    // Filter by query
    const q = query.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((o) => o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q));
    }

    // Sort
    if (sortBy === "Oldest Order") {
      filtered = [...filtered].reverse();
    }

    return filtered;
  }, [mappedOrders, activeStatus, query, sortBy]);

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
                background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.5px",
              }}>
                Orders
              </h1>
              <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 15 }}>
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
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
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
                  color: autoRefresh ? "#8b5cf6" : "#64748b",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
                title="Auto-refresh every 10 seconds"
              >
                <Zap size={16} style={{ color: autoRefresh ? "#8b5cf6" : "#64748b" }} />
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
                  background: "white",
                  cursor: refreshing ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#64748b",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
                title="Refresh orders (Ctrl+R)"
              >
                <RefreshCw size={16} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
                Refresh
              </button>
              <Link
                href="/orders/new"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 20px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
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
              <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Order ID or Customer Name (Ctrl+K)"
                style={{
                  width: "100%",
                  padding: "14px 16px 14px 44px",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  background: "var(--bg-card)",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#8b5cf6";
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={{ position: "relative", minWidth: 180 }}>
              <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 36px 14px 16px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 14,
                    cursor: "pointer",
                    outline: "none",
                    appearance: "none",
                    boxSizing: "border-box",
                    transition: "all 0.2s ease",
                    background: "var(--bg-card)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#8b5cf6";
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <option>Latest Order</option>
                  <option>Oldest Order</option>
                </select>
                <ChevronDown size={16} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8" }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          {statusFilters.map((f) => {
            const isActive = f.label === activeStatus;
            const getStatusColor = (label: OrderStatus) => {
              switch (label) {
                case "In Progress":
                  return { bg: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.2)" };
                case "Ready to Served":
                  return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "rgba(16, 185, 129, 0.2)" };
                case "Waiting for Payment":
                  return { bg: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", border: "rgba(245, 158, 11, 0.2)" };
                default:
                  return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b", border: "rgba(100, 116, 139, 0.2)" };
              }
            };
            const colors = getStatusColor(f.label);

            return (
              <button
                key={f.label}
                onClick={() => setActiveStatus(f.label)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 18px",
                  borderRadius: 14,
                  border: `1px solid ${isActive ? colors.border : "rgba(0,0,0,0.08)"}`,
                  background: isActive ? colors.bg : "white",
                  color: isActive ? colors.color : "#64748b",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#f8fafc";
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
                  color: isActive ? "white" : "#64748b",
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
            <div style={{ textAlign: "center" }}>
              <Loader2 size={40} className="animate-spin" style={{ color: "#8b5cf6", margin: "0 auto 16px" }} />
              <p style={{ color: "#64748b", fontSize: 14 }}>Loading orders...</p>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: "16px 20px",
            borderRadius: 12,
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#dc2626",
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
            {filteredOrders.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "12px 16px", background: "white", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                <button
                  onClick={handleSelectAll}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    background: "white",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#64748b",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.borderColor = "#8b5cf6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }}
                >
                  {selectedOrderIds.size === filteredOrders.length ? (
                    <CheckSquare size={18} style={{ color: "#8b5cf6" }} />
                  ) : (
                    <Square size={18} />
                  )}
                  <span>{selectedOrderIds.size === filteredOrders.length ? "Deselect All" : "Select All"}</span>
                </button>
                {selectedOrderIds.size > 0 && (
                  <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                    {selectedOrderIds.size} order{selectedOrderIds.size !== 1 ? "s" : ""} selected
                  </span>
                )}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 24 }}>
              {filteredOrders.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px", background: "white", borderRadius: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                <FileText size={48} style={{ color: "#cbd5e1", margin: "0 auto 16px" }} />
                <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px", color: "#1e293b" }}>No orders found</h3>
                <p style={{ color: "#64748b", margin: 0 }}>
                  {query || activeStatus !== "All" ? "Try adjusting your search or filter criteria" : "Get started by creating your first order"}
                </p>
              </div>
              ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedOrderIds.has(order.id);
                const getStatusConfig = (status: string) => {
                  switch (status) {
                    case "In Progress":
                      return { bg: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", icon: Timer };
                    case "Ready to Served":
                      return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981", icon: Utensils };
                    case "Waiting for Payment":
                      return { bg: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", icon: CreditCard };
                    default:
                      return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b", icon: FileText };
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
                      border: isSelected ? "2px solid #ef4444" : "1px solid rgba(0,0,0,0.04)",
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
                          border: isSelected ? "2px solid #ef4444" : "2px solid #cbd5e1",
                          background: isSelected ? "#ef4444" : "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#ef4444";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = "#cbd5e1";
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
                          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                            {order.type}
                          </span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                          Order #{order.id.slice(0, 8)}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{order.time}</div>
                      </div>
                      <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: 14,
                        background: order.type === "Dine In" ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
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
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Progress</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{order.progress}%</span>
                      </div>
                      <div style={{
                        width: "100%",
                        height: 8,
                        borderRadius: 20,
                        background: "#f1f5f9",
                        overflow: "hidden",
                      }}>
                        <div style={{
                          width: `${order.progress}%`,
                          height: "100%",
                          background: `linear-gradient(90deg, ${statusConfig.color} 0%, ${statusConfig.color}dd 100%)`,
                          transition: "width 0.3s ease",
                        }} />
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div style={{
                      background: "#f8fafc",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 20,
                      border: "1px solid #e2e8f0",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Items ({order.itemsCount})</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>₹{order.total.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 120, overflowY: "auto" }}>
                        {order.items.slice(0, 3).map((it, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                              <div style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: it.checked ? "#f59e0b" : "#10b981",
                                flexShrink: 0,
                              }} />
                              <span style={{
                                fontWeight: 600,
                                color: "#1e293b",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}>
                                {it.name}
                              </span>
                            </div>
                            <span style={{ fontWeight: 700, color: "#64748b", marginLeft: 8 }}>x{it.qty}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textAlign: "center", paddingTop: 4 }}>
                            +{order.items.length - 3} more items
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() => setSelectedOrderId(order.id)}
                        style={{
                          flex: 1,
                          padding: "12px 18px",
                          borderRadius: 12,
                          border: "1px solid #e2e8f0",
                          background: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#64748b",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#8b5cf6";
                          e.currentTarget.style.color = "#8b5cf6";
                          e.currentTarget.style.background = "#faf5ff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#e2e8f0";
                          e.currentTarget.style.color = "#64748b";
                          e.currentTarget.style.background = "white";
                        }}
                      >
                        <FileText size={16} /> Details
                      </button>
                      {order.status === "Ready to Served" && (
                        <button
                          onClick={() => handleMarkServed(order.id)}
                          disabled={actionLoading === `serve-${order.id}`}
                          style={{
                            flex: 1,
                            padding: "12px 18px",
                            borderRadius: 12,
                            border: "none",
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            cursor: actionLoading === `serve-${order.id}` ? "not-allowed" : "pointer",
                            fontSize: 14,
                            fontWeight: 700,
                            color: "white",
                            boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                            transition: "all 0.2s ease",
                            opacity: actionLoading === `serve-${order.id}` ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (actionLoading !== `serve-${order.id}`) {
                              e.currentTarget.style.transform = "translateY(-1px)";
                              e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.45)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 4px 14px rgba(16, 185, 129, 0.35)";
                          }}
                        >
                          {actionLoading === `serve-${order.id}` ? (
                            <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Processing...</>
                          ) : (
                            <><Utensils size={16} /> Mark Served</>
                          )}
                        </button>
                      )}
                      {order.status === "Waiting for Payment" && (
                        <button
                          onClick={() => handleBillOrder(order.id)}
                          disabled={actionLoading === `bill-${order.id}`}
                          style={{
                            flex: 1,
                            padding: "12px 18px",
                            borderRadius: 12,
                            border: "none",
                            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            cursor: actionLoading === `bill-${order.id}` ? "not-allowed" : "pointer",
                            fontSize: 14,
                            fontWeight: 700,
                            color: "white",
                            boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
                            transition: "all 0.2s ease",
                            opacity: actionLoading === `bill-${order.id}` ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (actionLoading !== `bill-${order.id}`) {
                              e.currentTarget.style.transform = "translateY(-1px)";
                              e.currentTarget.style.boxShadow = "0 6px 20px rgba(245, 158, 11, 0.45)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 4px 14px rgba(245, 158, 11, 0.35)";
                          }}
                        >
                          {actionLoading === `bill-${order.id}` ? (
                            <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Processing...</>
                          ) : (
                            <><CreditCard size={16} /> Bill Order</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            </div>
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
                background: "white",
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
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>
                  Delete {selectedOrderIds.size} order{selectedOrderIds.size !== 1 ? "s" : ""}?
                </div>
                <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
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
                    border: "1px solid #e2e8f0",
                    background: "white",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#64748b",
                    cursor: deleting ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!deleting) {
                      e.currentTarget.style.background = "#f8fafc";
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
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
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
                background: "white",
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
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: "#1e293b" }}>Order Details</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>Order #{selectedOrder.id}</div>
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <div style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Order Type</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{selectedOrder.type}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Time</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{selectedOrder.time}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: selectedOrder.type === "Dine In" ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
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
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Table</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{selectedOrder.table}</div>
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  borderRadius: 14,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: `conic-gradient(#10b981 ${selectedOrder.progress * 3.6}deg, #e2e8f0 0deg)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}>
                      <div style={{
                        position: "absolute",
                        inset: 4,
                        borderRadius: "50%",
                        background: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#10b981",
                      }}>
                        {selectedOrder.progress}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{selectedOrder.status}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{selectedOrder.itemsCount} items</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {detailItems.map((it) => (
                    <div
                      key={it.id}
                      style={{
                        borderRadius: 16,
                        border: "1px solid #e2e8f0",
                        overflow: "hidden",
                        background: "white",
                      }}
                    >
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        background: it.status === "Served" ? "linear-gradient(180deg, rgba(16, 185, 129, 0.12), rgba(255, 255, 255, 0))" : "linear-gradient(180deg, rgba(59, 130, 246, 0.08), rgba(255, 255, 255, 0))",
                      }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, color: it.status === "Served" ? "#10b981" : "#3b82f6" }}>
                          {it.status === "Served" ? <CheckCircle2 size={18} /> : <Timer size={18} />}
                          <span>{it.status}</span>
                        </div>
                        {it.status === "Waiting to cooked" && (
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
                            onMouseEnter={(e) => {
                              if (actionLoading !== `cancel-${it.id}`) {
                                e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(239, 68, 68, 0.06)";
                            }}
                          >
                            {actionLoading === `cancel-${it.id}` ? (
                              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                            ) : (
                              <>
                                <UtensilsCrossed size={14} /> Cancel
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 16, padding: 16 }}>
                        {it.imageUrl ? (
                          <Image
                            src={it.imageUrl}
                            alt={it.name}
                            width={80}
                            height={80}
                            style={{ objectFit: "cover", borderRadius: 12, border: "1px solid #e2e8f0" }}
                          />
                        ) : (
                          <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: 12,
                            background: "#f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#94a3b8",
                            fontSize: 11,
                            fontWeight: 600,
                            border: "1px solid #e2e8f0",
                          }}>
                            No Image
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{it.name}</div>
                          {it.additions && <div style={{ fontSize: 13, color: "#64748b", marginBottom: 2 }}>{it.additions}</div>}
                          {it.note && <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>Note: {it.note}</div>}
                        </div>
                      </div>

                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderTop: "1px solid #f1f5f9",
                        background: "#f8fafc",
                      }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>₹{it.price.toFixed(2)}</div>
                        <div style={{
                          padding: "6px 12px",
                          borderRadius: 20,
                          border: "1px solid #e2e8f0",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#64748b",
                          background: "white",
                        }}>
                          x{it.qty}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                borderTop: "1px solid #f1f5f9",
                padding: "20px 28px 28px",
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                  paddingBottom: 16,
                  borderBottom: "1px solid #e2e8f0",
                }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#64748b" }}>Total Payment</span>
                  <span style={{ fontSize: 28, fontWeight: 800, color: "#1e293b" }}>₹{selectedOrder.total.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <Link
                    href="/orders/new"
                    style={{
                      flex: 1,
                      padding: "14px 20px",
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      background: "white",
                      fontSize: 14,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      textDecoration: "none",
                      color: "#64748b",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.background = "white";
                    }}
                  >
                    <Plus size={18} /> New Order
                  </Link>
                  {selectedOrder.status === "Ready to Served" && (
                    <button
                      onClick={() => handleMarkServed(selectedOrder.id)}
                      disabled={actionLoading === `serve-${selectedOrder.id}`}
                      style={{
                        flex: 1,
                        padding: "14px 20px",
                        borderRadius: 12,
                        border: "none",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "white",
                        cursor: actionLoading === `serve-${selectedOrder.id}` ? "not-allowed" : "pointer",
                        opacity: actionLoading === `serve-${selectedOrder.id}` ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (actionLoading !== `serve-${selectedOrder.id}`) {
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.45)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 14px rgba(16, 185, 129, 0.35)";
                      }}
                    >
                      {actionLoading === `serve-${selectedOrder.id}` ? (
                        <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Processing...</>
                      ) : (
                        <><Utensils size={18} /> Mark as Served</>
                      )}
                    </button>
                  )}
                  {selectedOrder.status === "Waiting for Payment" && (
                    <button
                      onClick={() => handleBillOrder(selectedOrder.id)}
                      disabled={actionLoading === `bill-${selectedOrder.id}`}
                      style={{
                        flex: 1,
                        padding: "14px 20px",
                        borderRadius: 12,
                        border: "none",
                        background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "white",
                        cursor: actionLoading === `bill-${selectedOrder.id}` ? "not-allowed" : "pointer",
                        opacity: actionLoading === `bill-${selectedOrder.id}` ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (actionLoading !== `bill-${selectedOrder.id}`) {
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 6px 20px rgba(245, 158, 11, 0.45)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 14px rgba(245, 158, 11, 0.35)";
                      }}
                    >
                      {actionLoading === `bill-${selectedOrder.id}` ? (
                        <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Processing...</>
                      ) : (
                        <><CreditCard size={18} /> Proceed to Payment</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
