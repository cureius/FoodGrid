"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  FileText, 
  ChevronRight,
  Loader2,
  TrendingUp,
  Users,
  Utensils,
  AlertCircle,
  ArrowRight,
  DollarSign,
  Timer,
  Receipt,
  Coffee
} from "lucide-react";
import { listOrders, listTables, listMenuItems, type OrderResponse, type MenuItemResponse } from "@/lib/api/clientAdmin";
import { useOutlet } from "@/contexts/OutletContext";

type TableResponse = {
  id: string;
  tableCode: string;
  displayName: string;
  capacity: number;
  status: string;
};

// Utility functions
function formatMoney(v: number) {
  return `₹${v.toFixed(2)}`;
}

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

function mapOrderType(orderType: string): "Dine In" | "Take Away" | "Delivery" {
  switch (orderType) {
    case "DINE_IN":
      return "Dine In";
    case "TAKEAWAY":
      return "Take Away";
    case "DELIVERY":
      return "Delivery";
    default:
      return "Take Away";
  }
}

function getOrderTypeColor(orderType: string) {
  switch (orderType) {
    case "DINE_IN":
      return { bg: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.2)" };
    case "TAKEAWAY":
      return { bg: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", border: "rgba(139, 92, 246, 0.2)" };
    case "DELIVERY":
      return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "rgba(16, 185, 129, 0.2)" };
    default:
      return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b", border: "rgba(100, 116, 139, 0.2)" };
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "OPEN":
    case "KOT_SENT":
      return { bg: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", border: "rgba(245, 158, 11, 0.2)" };
    case "SERVED":
      return { bg: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.2)" };
    case "BILLED":
      return { bg: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", border: "rgba(139, 92, 246, 0.2)" };
    case "PAID":
      return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "rgba(16, 185, 129, 0.2)" };
    default:
      return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b", border: "rgba(100, 116, 139, 0.2)" };
  }
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function getCurrentTime(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function getCurrentDate(): string {
  const now = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [tables, setTables] = useState<TableResponse[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const { selectedOutletId, selectedOutlet } = useOutlet();

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch data when outletId is available
  useEffect(() => {
    if (!selectedOutletId) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const [ordersData, tablesData, menuData] = await Promise.all([
          listOrders(100, selectedOutletId),
          listTables(selectedOutletId),
          listMenuItems(selectedOutletId)
        ]);
        
        setOrders(ordersData || []);
        setTables(tablesData || []);
        setMenuItems(menuData || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load dashboard data");
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedOutletId]);

  // Computed statistics
  const stats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= todayStart;
    });

    const paidOrders = todayOrders.filter(o => o.status === "PAID");
    const totalEarnings = paidOrders.reduce((sum, o) => sum + Number(o.grandTotal), 0);
    const inProgressOrders = orders.filter(o => ["OPEN", "KOT_SENT", "SERVED"].includes(o.status));
    const billedOrders = orders.filter(o => o.status === "BILLED");
    const completedOrders = orders.filter(o => o.status === "PAID");

    return {
      totalEarnings,
      inProgress: inProgressOrders.length,
      waitingPayment: billedOrders.length,
      completed: completedOrders.length,
      todayOrdersCount: todayOrders.length,
    };
  }, [orders]);

  // Get in-progress orders
  const inProgressOrders = useMemo(() => {
    return orders
      .filter(o => ["OPEN", "KOT_SENT", "SERVED"].includes(o.status))
      .slice(0, 6);
  }, [orders]);

  // Get orders waiting for payment
  const waitingPaymentOrders = useMemo(() => {
    return orders
      .filter(o => o.status === "BILLED")
      .slice(0, 6);
  }, [orders]);

  // Get available tables
  const availableTables = useMemo(() => {
    const occupiedTableIds = new Set(
      orders
        .filter(o => ["OPEN", "KOT_SENT", "SERVED", "BILLED"].includes(o.status) && o.tableId)
        .map(o => o.tableId)
    );
    return tables.filter(t => t.status === "AVAILABLE" && !occupiedTableIds.has(t.id));
  }, [tables, orders]);

  // Get out of stock items (INACTIVE items)
  const outOfStockItems = useMemo(() => {
    return menuItems.filter(item => item.status === "INACTIVE").slice(0, 6);
  }, [menuItems]);

  // Stat card data
  const statCards = [
    {
      label: "Today's Earnings",
      value: formatMoney(stats.totalEarnings),
      icon: DollarSign,
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      bgGradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)",
      iconBg: "rgba(16, 185, 129, 0.15)",
      color: "#059669"
    },
    {
      label: "In Progress",
      value: stats.inProgress.toString(),
      icon: Timer,
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      bgGradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)",
      iconBg: "rgba(245, 158, 11, 0.15)",
      color: "#d97706"
    },
    {
      label: "Waiting Payment",
      value: stats.waitingPayment.toString(),
      icon: Receipt,
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      bgGradient: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)",
      iconBg: "rgba(139, 92, 246, 0.15)",
      color: "#7c3aed"
    },
    {
      label: "Completed",
      value: stats.completed.toString(),
      icon: CheckCircle,
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      bgGradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)",
      iconBg: "rgba(59, 130, 246, 0.15)",
      color: "#2563eb"
    },
  ];

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "calc(100vh - 72px)",
        background: "#f8fafc"
      }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 
            size={48} 
            style={{ 
              color: "#8b5cf6", 
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px" 
            }} 
          />
          <p style={{ color: "#64748b", fontSize: 15 }}>Loading dashboard...</p>
        </div>
        <style jsx global>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "24px 32px", 
      background: "#f8fafc",
      minHeight: "calc(100vh - 72px)"
    }}>
      {/* Header Section */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-start", 
        gap: 24, 
        marginBottom: 28,
        flexWrap: "wrap"
      }}>
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
            {getGreeting()}, Staff! 👋
          </h1>
          <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 15 }}>
            Give your best services for customers, happy working!
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#1e293b",
              fontVariantNumeric: "tabular-nums",
            }}>
              {currentTime}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
              {getCurrentDate()}
            </div>
          </div>
          
          <Link href="/orders/new">
            <button
              style={{
                height: 52,
                padding: "0 28px",
                borderRadius: 14,
                background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                color: "white",
                fontSize: 15,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
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
              <Plus size={20} />
              New Order
            </button>
          </Link>
        </div>
      </div>

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
          <AlertCircle size={20} />
          <span style={{ fontWeight: 600 }}>Error: {error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 20,
        marginBottom: 28,
      }}>
        {statCards.map((stat, index) => (
          <div
            key={index}
            style={{
              background: "white",
              borderRadius: 20,
              padding: "24px",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              transition: "all 0.2s ease",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#1e293b" }}>
                  {stat.value}
                </div>
              </div>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: stat.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <stat.icon size={26} style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: 24,
      }}>
        {/* Left Column - Orders */}
        <div style={{ display: "flex", flexDirection: "row", gap: 24 }}>
          {/* In Progress Orders */}
          <div style={{
            background: "white",
            borderRadius: 20,
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            width: "50%",
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(245, 158, 11, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Timer size={20} style={{ color: "#f59e0b" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#1e293b" }}>In Progress</h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{inProgressOrders.length} active orders</p>
                </div>
              </div>
              <Link href="/orders">
                <button style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  background: "white",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#64748b",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
                >
                  View All <ChevronRight size={16} />
                </button>
              </Link>
            </div>
            
            <div style={{ padding: 16, maxHeight: 400, overflowY: "auto" }}>
              {inProgressOrders.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "40px 20px", 
                  color: "#64748b" 
                }}>
                  <Coffee size={40} style={{ color: "#cbd5e1", marginBottom: 12 }} />
                  <p style={{ margin: 0, fontWeight: 600, color: "#1e293b" }}>No orders in progress</p>
                  <p style={{ margin: "8px 0 0", fontSize: 13 }}>New orders will appear here</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {inProgressOrders.map((order) => {
                    const typeColor = getOrderTypeColor(order.orderType);
                    const statusColor = getStatusColor(order.status);
                    return (
                      <div
                        key={order.id}
                        style={{
                          padding: 16,
                          borderRadius: 14,
                          border: "1px solid #e2e8f0",
                          background: "#fafafa",
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#cbd5e1";
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#e2e8f0";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 42,
                              height: 42,
                              borderRadius: 10,
                              background: typeColor.bg,
                              border: `1px solid ${typeColor.border}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 14,
                              color: typeColor.color,
                            }}>
                              {order.tableId ? order.tableId.slice(0, 2).toUpperCase() : "TA"}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                                Order #{order.id.slice(0, 8)}
                              </div>
                              <div style={{ fontSize: 12, color: "#64748b" }}>
                                {mapOrderType(order.orderType)}
                                {order.tableId && ` • Table ${order.tableId}`}
                              </div>
                            </div>
                          </div>
                          <div style={{
                            padding: "4px 10px",
                            borderRadius: 8,
                            background: statusColor.bg,
                            border: `1px solid ${statusColor.border}`,
                            fontSize: 11,
                            fontWeight: 700,
                            color: statusColor.color,
                          }}>
                            {order.status.replace("_", " ")}
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {formatOrderTime(order.createdAt)}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                              {order.items?.length || 0} items
                            </span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: "#8b5cf6" }}>
                              {formatMoney(Number(order.grandTotal))}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Waiting for Payment */}
          <div style={{
            background: "white",
            borderRadius: 20,
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            width: "50%",
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(139, 92, 246, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Receipt size={20} style={{ color: "#8b5cf6" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#1e293b" }}>Waiting for Payment</h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{waitingPaymentOrders.length} orders pending</p>
                </div>
              </div>
              <Link href="/orders">
                <button style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  background: "white",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#64748b",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
                >
                  View All <ChevronRight size={16} />
                </button>
              </Link>
            </div>
            
            <div style={{ padding: 16, maxHeight: 400, overflowY: "auto" }}>
              {waitingPaymentOrders.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "40px 20px", 
                  color: "#64748b" 
                }}>
                  <CheckCircle size={40} style={{ color: "#cbd5e1", marginBottom: 12 }} />
                  <p style={{ margin: 0, fontWeight: 600, color: "#1e293b" }}>All payments processed!</p>
                  <p style={{ margin: "8px 0 0", fontSize: 13 }}>No pending payments at the moment</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {waitingPaymentOrders.map((order) => {
                    const typeColor = getOrderTypeColor(order.orderType);
                    return (
                      <div
                        key={order.id}
                        style={{
                          padding: 16,
                          borderRadius: 14,
                          border: "1px solid rgba(139, 92, 246, 0.2)",
                          background: "rgba(139, 92, 246, 0.03)",
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.4)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.2)";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 42,
                              height: 42,
                              borderRadius: 10,
                              background: typeColor.bg,
                              border: `1px solid ${typeColor.border}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 14,
                              color: typeColor.color,
                            }}>
                              {order.tableId ? order.tableId.slice(0, 2).toUpperCase() : "TA"}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                                Order #{order.id.slice(0, 8)}
                              </div>
                              <div style={{ fontSize: 12, color: "#64748b" }}>
                                {mapOrderType(order.orderType)}
                                {order.tableId && ` • Table ${order.tableId}`}
                              </div>
                            </div>
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#8b5cf6" }}>
                            {formatMoney(Number(order.grandTotal))}
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {formatOrderTime(order.createdAt)}
                          </div>
                          <button style={{
                            padding: "8px 16px",
                            borderRadius: 10,
                            background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                            color: "white",
                            fontSize: 13,
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)",
                          }}>
                            <CreditCard size={14} /> Process Payment
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Tables and Menu Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Available Tables */}
          <div style={{
            background: "white",
            borderRadius: 20,
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            overflow: "hidden",
            flex: 1,
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(16, 185, 129, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Users size={20} style={{ color: "#10b981" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#1e293b" }}>Available Tables</h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                    {availableTables.length} of {tables.length} tables free
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ padding: 16, maxHeight: 320, overflowY: "auto" }}>
              {availableTables.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "32px 20px", 
                  color: "#64748b" 
                }}>
                  <Users size={36} style={{ color: "#cbd5e1", marginBottom: 10 }} />
                  <p style={{ margin: 0, fontWeight: 600, color: "#1e293b", fontSize: 14 }}>All tables occupied</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {availableTables.slice(0, 8).map((table) => (
                    <div
                      key={table.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        background: "#fafafa",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#10b981";
                        e.currentTarget.style.background = "rgba(16, 185, 129, 0.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#e2e8f0";
                        e.currentTarget.style.background = "#fafafa";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 700,
                          fontSize: 13,
                        }}>
                          {table.tableCode}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>
                          {table.displayName}
                        </div>
                      </div>
                      <div style={{
                        padding: "4px 10px",
                        borderRadius: 8,
                        background: "rgba(16, 185, 129, 0.1)",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#10b981",
                      }}>
                        {table.capacity} seats
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Out of Stock Items */}
          <div style={{
            background: "white",
            borderRadius: 20,
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            overflow: "hidden",
            flex: 1,
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(239, 68, 68, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <AlertCircle size={20} style={{ color: "#ef4444" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#1e293b" }}>Unavailable Items</h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                    {outOfStockItems.length} items inactive
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ padding: 16, maxHeight: 320, overflowY: "auto" }}>
              {outOfStockItems.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "32px 20px", 
                  color: "#64748b" 
                }}>
                  <Utensils size={36} style={{ color: "#cbd5e1", marginBottom: 10 }} />
                  <p style={{ margin: 0, fontWeight: 600, color: "#1e293b", fontSize: 14 }}>All items available!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {outOfStockItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid rgba(239, 68, 68, 0.15)",
                        background: "rgba(239, 68, 68, 0.03)",
                      }}
                    >
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: "#f1f5f9",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}>
                        {item.primaryImageUrl ? (
                          <img 
                            src={item.primaryImageUrl} 
                            alt={item.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                            <Utensils size={18} style={{ color: "#cbd5e1" }} />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: "#1e293b",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
                          Currently unavailable
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 1280px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        @media (max-width: 1024px) {
          .main-grid {
            grid-template-columns: 1fr !important;
          }
        }
        
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}