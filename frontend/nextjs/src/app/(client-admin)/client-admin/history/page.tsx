"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import styles from "./History.module.css";
import { cn } from "@/lib/utils";
import { History as HistoryIcon, Search, ReceiptText, Printer, Calendar, Filter, Loader2, Download } from "lucide-react";
import { listOrders, getOrder, type OrderResponse } from "@/lib/api/clientAdmin";
import { useOutlet } from "@/contexts/OutletContext";

type HistoryFilter = "All" | "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "CANCELLED";

// Map backend orderType to frontend display
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

function formatOrderDateShort(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  } catch {
    return "";
  }
}

function formatOrderTimeOnly(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${ampm}`;
  } catch {
    return "";
  }
}

function formatMoney(v: number) {
  return `₹${v.toFixed(2)}`;
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<HistoryFilter>("All");
  const [query, setQuery] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { selectedOutletId } = useOutlet();

  // Fetch orders when outletId is available
  useEffect(() => {
    if (!selectedOutletId) return;

    async function fetchOrders() {
      try {
        setLoading(true);
        setError(null);
        // Fetch paid/billed orders for history
        if (!selectedOutletId) return;
        const data = await listOrders(500, selectedOutletId);
        // Show terminal states: PAID (Dine-in), SERVED (Takeaway), CANCELLED
        const historyOrders = data.filter(o => 
          o.status === "PAID" || 
          (o.orderType === "TAKEAWAY" && o.status === "SERVED") ||
          o.status === "CANCELLED"
        );
        setOrders(historyOrders);
      } catch (err: any) {
        setError(err?.message || "Failed to load order history");
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [selectedOutletId]);

  // Fetch selected order details
  useEffect(() => {
    if (selectedId) {
      async function fetchOrderDetails() {
        try {
          setDetailsLoading(true);
          if (!selectedId) return;
          const data = await getOrder(selectedId);
          setSelectedOrder(data);
        } catch (err: any) {
          console.error("Failed to fetch order details:", err);
          setSelectedOrder(null);
        } finally {
          setDetailsLoading(false);
        }
      }
      fetchOrderDetails();
    } else {
      setSelectedOrder(null);
    }
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesFilter =
        filter === "All"
          ? true
          : filter === "CANCELLED"
            ? o.status === "CANCELLED"
            : o.orderType === filter;
      const matchesQuery =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.id.slice(-4).toLowerCase().includes(q) ||
        (o.tableId ? o.tableId.toLowerCase().includes(q) : false);
      return matchesFilter && matchesQuery;
    });
  }, [orders, filter, query]);

  const selectedSubTotal = useMemo(() => {
    if (!selectedOrder) return 0;
    return Number(selectedOrder.subtotal);
  }, [selectedOrder]);

  const selectedTax = useMemo(() => {
    if (!selectedOrder) return 0;
    return Number(selectedOrder.taxTotal);
  }, [selectedOrder]);

  const selectedTotal = useMemo(() => {
    if (!selectedOrder) return 0;
    return Number(selectedOrder.grandTotal);
  }, [selectedOrder]);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${selectedOrder?.id || 'Order'}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 10px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.4;
              }
            }
            body {
              margin: 0;
              padding: 10px;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              max-width: 80mm;
            }
            .invoice-header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .invoice-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .invoice-info {
              margin-bottom: 10px;
            }
            .invoice-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .invoice-items {
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 10px 0;
              margin: 10px 0;
            }
            .invoice-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .invoice-item-name {
              flex: 1;
            }
            .invoice-item-qty {
              margin: 0 10px;
            }
            .invoice-totals {
              margin-top: 10px;
            }
            .invoice-total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .invoice-grand-total {
              border-top: 2px solid #000;
              padding-top: 5px;
              margin-top: 5px;
              font-weight: bold;
              font-size: 14px;
            }
            .invoice-footer {
              text-align: center;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px dashed #000;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24, height: "100%", minHeight: 0, background: "var(--bg-app)", color: "var(--text-primary)" }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 4 }}>
          <div>
            <h1 style={{
              fontSize: 32,
              fontWeight: 800,
              margin: 0,
              color: "var(--text-primary)",
              letterSpacing: "-0.5px",
            }}>
              Order History
            </h1>
            <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: 15 }}>
              View and print invoices for completed orders
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 280, maxWidth: 500 }}>
              <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Order ID or Table"
                style={{
                  width: "100%",
                  padding: "14px 16px 14px 44px",
                  borderRadius: 12,
                  border: "1px solid var(--component-border)",
                  background: "var(--component-bg)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.background = "var(--bg-surface)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px var(--primary-light)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--component-border)";
                  e.currentTarget.style.background = "var(--component-bg)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <div style={{ textAlign: "center" }}>
            <Loader2 size={40} className="animate-spin" style={{ color: "#8b5cf6", margin: "0 auto 16px" }} />
            <p style={{ color: "#64748b", fontSize: 14 }}>Loading order history...</p>
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
          <span style={{ fontWeight: 600 }}>Error: {error}</span>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(400px, 1fr)", gap: 24, flex: 1, minHeight: 0 }}>
          <div style={{
            borderRadius: 20,
            border: "1px solid rgba(0,0,0,0.08)",
            background: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}>
            <div style={{ padding: 20, borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {(["All", "DINE_IN", "TAKEAWAY", "DELIVERY", "CANCELLED"] as HistoryFilter[]).map((f) => {
                  const isActive = filter === f;
                  const getLabel = (val: HistoryFilter) => {
                    switch (val) {
                      case "DINE_IN": return "Dine In";
                      case "TAKEAWAY": return "Take Away";
                      case "DELIVERY": return "Delivery";
                      case "CANCELLED": return "Cancelled";
                      default: return "All";
                    }
                  };
                  const getColor = (val: HistoryFilter) => {
                    switch (val) {
                      case "DINE_IN": return { bg: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.2)" };
                      case "TAKEAWAY": return { bg: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", border: "rgba(139, 92, 246, 0.2)" };
                      case "DELIVERY": return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "rgba(16, 185, 129, 0.2)" };
                      case "CANCELLED": return { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "rgba(239, 68, 68, 0.2)" };
                      default: return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b", border: "rgba(100, 116, 139, 0.2)" };
                    }
                  };
                  const colors = getColor(f);

                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 16px",
                        borderRadius: 12,
                        border: `1px solid ${isActive ? colors.border : "rgba(0,0,0,0.08)"}`,
                        background: isActive ? colors.bg : "white",
                        color: isActive ? colors.color : "#64748b",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
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
                      {getLabel(f)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: 16,
              background: "var(--bg-app)",
            }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
                  <HistoryIcon size={48} style={{ color: "var(--text-tertiary)", margin: "0 auto 16px" }} />
                  <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px", color: "var(--text-primary)" }}>No orders found</h3>
                  <p style={{ margin: 0, fontSize: 14 }}>
                    {query || filter !== "All" ? "Try adjusting your search or filter" : "No completed orders yet"}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {filtered.map((o) => {
                    const isSelected = selectedId === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setSelectedId(o.id)}
                        style={{
                          borderRadius: 16,
                          border: `2px solid ${isSelected ? "var(--primary)" : "var(--component-border)"}`,
                          background: isSelected ? "var(--primary-light)" : "var(--bg-surface)",
                          padding: 16,
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          boxShadow: isSelected ? "var(--shadow-md)" : "var(--shadow-sm)",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = "var(--component-border-hover)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "var(--shadow-md)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = "var(--component-border)";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                          }
                        }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                            Order# <span style={{ color: "var(--primary)" }}>{o.id.slice(-4).toUpperCase()}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
                            {formatOrderTime(o.createdAt || null)}
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4, fontWeight: 600 }}>Order Type</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{mapOrderType(o.orderType)}</div>
                          </div>
                          {o.tableId && (
                            <div>
                              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4, fontWeight: 600 }}>Table</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{o.tableId}</div>
                            </div>
                          )}
                          <div style={{ gridColumn: "1 / -1" }}>
                            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4, fontWeight: 600 }}>Total</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>{formatMoney(Number(o.grandTotal))}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={{
            borderRadius: 20,
            border: "1px solid rgba(0,0,0,0.08)",
            background: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}>
            {detailsLoading ? (
              <div style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 40,
                textAlign: "center",
                color: "#64748b",
              }}>
                <Loader2 size={40} className="animate-spin" style={{ color: "#8b5cf6", marginBottom: 16 }} />
                <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>Loading Bill...</div>
              </div>
            ) : selectedOrder ? (
              <>
                <div style={{
                  padding: "24px 28px",
                  borderBottom: "1px solid var(--border-light)",
                  background: "var(--bg-tertiary)",
                }}>
                  <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: "var(--text-primary)" }}>Bill Information</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Invoice Details</div>
                </div>

                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-light)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 18,
                      boxShadow: "var(--shadow-md)",
                    }}>
                      {selectedOrder.tableId ? selectedOrder.tableId.slice(0, 2) : "TA"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>
                        Order #{selectedOrder.id.slice(-4).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        {mapOrderType(selectedOrder.orderType)}
                        {selectedOrder.tableId && ` • Table ${selectedOrder.tableId}`}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>{formatOrderDateShort(selectedOrder.createdAt || null)}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{formatOrderTimeOnly(selectedOrder.createdAt || null)}</div>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "#64748b" }}>Order Details</div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {selectedOrder.items.filter(item => item.status !== "CANCELLED").map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 16,
                          paddingBottom: 12,
                          borderBottom: "1px solid var(--border-light)",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>{item.itemName}</div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{formatMoney(Number(item.unitPrice))} per item</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>x {Number(item.qty)}</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>{formatMoney(Number(item.lineTotal))}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  padding: "20px 24px",
                  borderTop: "1px solid var(--border-light)",
                  background: "var(--bg-tertiary)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
                    <span>Sub Total</span>
                    <span>{formatMoney(selectedSubTotal)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
                    <span>Tax</span>
                    <span>{formatMoney(selectedTax)}</span>
                  </div>
                  {Number(selectedOrder.discountTotal) > 0 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
                      <span>Discount</span>
                      <span>-{formatMoney(Number(selectedOrder.discountTotal))}</span>
                    </div>
                  )}
                  <div style={{
                    height: 1,
                    background: "var(--component-border)",
                    margin: "12px 0",
                  }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
                    <span>Total Payment</span>
                    <span style={{ fontSize: 24, color: "var(--primary)" }}>{formatMoney(selectedTotal)}</span>
                  </div>
                </div>

                <div style={{ padding: "20px 24px", borderTop: "1px solid #f1f5f9" }}>
                  <button
                    type="button"
                    onClick={handlePrint}
                    style={{
                      width: "100%",
                      height: 52,
                      borderRadius: 14,
                      background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 15,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      boxShadow: "0 4px 14px rgba(139, 92, 246, 0.35)",
                      border: "none",
                      cursor: "pointer",
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
                    <Printer size={20} /> Print Invoice
                  </button>
                </div>

                {/* Hidden print content */}
                <div ref={printRef} style={{ display: "none" }}>
                  <div className="invoice-header">
                    <div className="invoice-title">INVOICE</div>
                    <div style={{ fontSize: "11px" }}>Order #{selectedOrder.id}</div>
                  </div>
                  <div className="invoice-info">
                    <div className="invoice-row">
                      <span>Date:</span>
                      <span>{formatOrderDateShort(selectedOrder.createdAt || null)} {formatOrderTimeOnly(selectedOrder.createdAt || null)}</span>
                    </div>
                    <div className="invoice-row">
                      <span>Type:</span>
                      <span>{mapOrderType(selectedOrder.orderType)}</span>
                    </div>
                    {selectedOrder.tableId && (
                      <div className="invoice-row">
                        <span>Table:</span>
                        <span>{selectedOrder.tableId}</span>
                      </div>
                    )}
                  </div>
                  <div className="invoice-items">
                    {selectedOrder.items.filter(item => item.status !== "CANCELLED").map((item) => (
                      <div key={item.id} className="invoice-item">
                        <div className="invoice-item-name">{item.itemName}</div>
                        <div className="invoice-item-qty">x{Number(item.qty)}</div>
                        <div>{formatMoney(Number(item.lineTotal))}</div>
                      </div>
                    ))}
                  </div>
                  <div className="invoice-totals">
                    <div className="invoice-total-row">
                      <span>Sub Total:</span>
                      <span>{formatMoney(selectedSubTotal)}</span>
                    </div>
                    <div className="invoice-total-row">
                      <span>Tax:</span>
                      <span>{formatMoney(selectedTax)}</span>
                    </div>
                    {Number(selectedOrder.discountTotal) > 0 && (
                      <div className="invoice-total-row">
                        <span>Discount:</span>
                        <span>-{formatMoney(Number(selectedOrder.discountTotal))}</span>
                      </div>
                    )}
                    <div className="invoice-grand-total invoice-total-row">
                      <span>TOTAL:</span>
                      <span>{formatMoney(selectedTotal)}</span>
                    </div>
                  </div>
                  <div className="invoice-footer">
                    <div>Thank you for your visit!</div>
                    <div style={{ marginTop: "5px" }}>Have a great day!</div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 40,
                textAlign: "center",
                color: "#64748b",
              }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  background: "#f8fafc",
                }}>
                  <ReceiptText size={32} style={{ color: "#cbd5e1" }} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>Select Order</div>
                <div style={{ fontSize: 14, color: "#64748b" }}>
                  Select an order from the left to view and print the invoice
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
