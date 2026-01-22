"use client";

import React, { useMemo, useState, useEffect } from "react";
import styles from "./Orders.module.css";
import Card from "@/components/ui/Card";
import { Plus, Search, ChevronDown, ArrowRight, FileText, X, Timer, CheckCircle2, UtensilsCrossed, Loader2 } from "lucide-react";
import Link from "next/link";
import { listOrders, getOrder, cancelOrderItem, markOrderServed, billOrder, type OrderResponse, type OrderItemResponse } from "@/lib/api/clientAdmin";
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
    time: formatOrderTime((order as any).createdAt || null), // createdAt not in DTO, will show "Recent"
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
  const { selectedOutletId } = useOutlet();

  // Fetch orders when outletId is available
  useEffect(() => {
    if (!selectedOutletId) return;
    
    async function fetchOrders() {
      try {
        setLoading(true);
        setError(null);
        const data = await listOrders(100, selectedOutletId); // Get up to 100 recent orders for the outlet
        setOrders(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load orders");
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [selectedOutletId]);

  // Fetch order details when selected
  useEffect(() => {
    if (selectedOrderId) {
      async function fetchOrderDetails() {
        try {
          const data = await getOrder(selectedOrderId);
          setSelectedOrderResponse(data);
        } catch (err: any) {
          console.error("Failed to fetch order details:", err);
          setSelectedOrderResponse(null);
        }
      }
      fetchOrderDetails();
    } else {
      setSelectedOrderResponse(null);
    }
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
      // Refresh orders
      const data = await listOrders(100, selectedOutletId);
      setOrders(data);
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
      // Refresh orders
      const data = await listOrders(100, selectedOutletId);
      setOrders(data);
      // Refresh selected order if it's the same
      if (selectedOrderId === orderId) {
        const orderData = await getOrder(orderId);
        setSelectedOrderResponse(orderData);
      }
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
      // Refresh orders
      const data = await listOrders(100, selectedOutletId);
      setOrders(data);
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

  const detailItems = useMemo(() => {
    if (!selectedOrderResponse) return [];
    return selectedOrderResponse.items
      .filter((item) => item.status !== "CANCELLED")
      .map((item) => mapOrderItemToDetailItem(item));
  }, [selectedOrderResponse]);

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <div className={styles.pageTitlePill}>
          <FileText size={18} />
          <span>Order</span>
        </div>

        <div className={styles.topActions}>
          <div className={styles.searchBar}>
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Order ID or Customer Name"
            />
          </div>

          <Link href="/client-admin/orders/new" className={styles.createBtn}>
            <Plus size={18} /> Create New Order
          </Link>

          <div className={styles.sortWrap}>
            <label className={styles.sortLabel} htmlFor="sort">
              Sort by:
            </label>
            <div className={styles.sortSelectWrap}>
              <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.sortSelect}>
                <option>Latest Order</option>
                <option>Oldest Order</option>
              </select>
              <ChevronDown size={16} className={styles.sortChevron} />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.filterRow}>
        {statusFilters.map((f) => (
          <button
            key={f.label}
            className={f.label === activeStatus ? styles.filterPillActive : styles.filterPill}
            onClick={() => setActiveStatus(f.label)}
          >
            <span>{f.label}</span>
            <span className={styles.pillCount}>{f.count}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <Loader2 size={32} className="animate-spin" />
        </div>
      )}

      {error && (
        <div style={{ padding: "20px", background: "#fee", color: "#c33", borderRadius: "8px", margin: "20px" }}>
          Error: {error}
        </div>
      )}

      {!loading && !error && (
        <div className={styles.grid}>
          {filteredOrders.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#666" }}>
              No orders found
            </div>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className={styles.orderCard} variant="outline">
                <div className={styles.cardTop}>
                  <div className={styles.cardMeta}>
                    <span className={styles.metaLeft}>
                      Order# <b>{order.id}</b> / <b>{order.type}</b>
                    </span>
                    <span className={styles.metaRight}>{order.time}</span>
                  </div>

                  <div className={styles.customerRow}>
                    <div className={styles.tablePill}>{order.table}</div>
                    <div className={styles.customerInfo}>
                      <div className={styles.customerLabel}>Customer Name</div>
                      <div className={styles.customerName}>{order.customer}</div>
                    </div>
                  </div>

                  <div className={styles.statusRow}>
                    <div className={styles.statusLeft}>
                      <div className={styles.progressRing} style={{ ["--p" as any]: `${order.progress}` }} aria-label={`Progress ${order.progress}%`}>
                        <span>{order.progress}%</span>
                      </div>
                      <div className={styles.statusText}>{order.status}</div>
                    </div>
                    <div className={styles.itemsCount}>
                      {order.itemsCount} Items <ArrowRight size={16} />
                    </div>
                  </div>
                </div>

                <div className={styles.itemsTable}>
                  <div className={styles.itemsHeader}>
                    <span>Items</span>
                    <span>Qty</span>
                    <span>Price</span>
                  </div>

                  <div className={styles.itemsBody}>
                    {order.items.map((it, idx) => (
                      <div key={idx} className={styles.itemRow}>
                        <div className={styles.itemNameWrap}>
                          <input type="checkbox" checked={it.checked} readOnly />
                          <span className={styles.itemName}>{it.name}</span>
                        </div>
                        <span className={styles.itemQty}>{it.qty}</span>
                        <span className={styles.itemPrice}>₹{it.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Total</span>
                    <span />
                    <span className={styles.totalValue}>₹{order.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <button className={styles.secondaryBtn} onClick={() => setSelectedOrderId(order.id)}>
                    See Details
                  </button>
                  <button
                    className={styles.primaryBtn}
                    disabled={order.status !== "Waiting for Payment"}
                    onClick={() => order.status === "Waiting for Payment" && handleBillOrder(order.id)}
                  >
                    Pay Bills
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {selectedOrder && selectedOrderResponse && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Detail Order" onMouseDown={() => setSelectedOrderId(null)}>
          <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Detail Order</div>
              <button className={styles.modalClose} aria-label="Close" onClick={() => setSelectedOrderId(null)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailMetaRow}>
                <div className={styles.detailMetaLeft}>
                  Order# <b>{selectedOrder.id}</b> / <b>{selectedOrder.type}</b>
                </div>
                <div className={styles.detailMetaRight}>{selectedOrder.time}</div>
              </div>

              <div className={styles.detailCustomerRow}>
                <div className={styles.detailTableBadge}>{selectedOrder.table}</div>
                <div className={styles.detailCustomerInfo}>
                  <div className={styles.detailCustomerLabel}>Customer Name</div>
                  <div className={styles.detailCustomerName}>{selectedOrder.customer}</div>
                </div>
              </div>

              <div className={styles.detailStatusBar}>
                <div className={styles.detailStatusLeft}>
                  <div className={styles.detailProgressBadge}>{selectedOrder.progress}%</div>
                  <div className={styles.detailStatusText}>{selectedOrder.status} •</div>
                </div>
                <div className={styles.detailItemsRight}>{selectedOrder.itemsCount} Items <ArrowRight size={16} /></div>
              </div>

              <div className={styles.detailItemsList}>
                {detailItems.map((it) => (
                  <div key={it.id} className={styles.detailItemCard}>
                    <div className={it.status === "Served" ? styles.detailItemHeaderServed : styles.detailItemHeaderWait}>
                      <div className={styles.detailItemHeaderLeft}>
                        {it.status === "Served" ? <CheckCircle2 size={18} /> : <Timer size={18} />}
                        <span>{it.status}</span>
                      </div>
                      {it.status === "Waiting to cooked" && (
                        <button
                          className={styles.cancelBtn}
                          onClick={() => handleCancelItem(selectedOrder.id, it.id)}
                          disabled={actionLoading === `cancel-${it.id}`}
                        >
                          {actionLoading === `cancel-${it.id}` ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <>
                              <UtensilsCrossed size={16} /> Cancel order
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className={styles.detailItemBody}>
                      {it.imageUrl ? (
                        <Image className={styles.detailItemImage} src={it.imageUrl} alt={it.name} width={80} height={80} style={{ objectFit: "cover" }} />
                      ) : (
                        <div className={styles.detailItemImage} style={{ background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          No Image
                        </div>
                      )}
                      <div className={styles.detailItemInfo}>
                        <div className={styles.detailItemName}>{it.name}</div>
                        {it.additions && <div className={styles.detailItemSub}>{it.additions}</div>}
                        {it.note && <div className={styles.detailItemNote}>{it.note}</div>}
                      </div>
                    </div>

                    <div className={styles.detailItemFooter}>
                      <div className={styles.detailItemPrice}>₹{it.price.toFixed(2)}</div>
                      <div className={styles.detailQtyPill}>x{it.qty}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <div className={styles.paymentRow}>
                <span>Total Payment</span>
                <b>₹{selectedOrder.total.toFixed(2)}</b>
              </div>
              <div className={styles.footerButtons}>
                <Link href="/client-admin/orders/new" className={styles.footerGhostBtn}>
                  <Plus size={18} /> New Order
                </Link>
                {selectedOrder.status === "Ready to Served" && (
                  <button
                    className={styles.footerPrimaryBtn}
                    onClick={() => handleMarkServed(selectedOrder.id)}
                    disabled={actionLoading === `serve-${selectedOrder.id}`}
                  >
                    {actionLoading === `serve-${selectedOrder.id}` ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Processing...
                      </>
                    ) : (
                      "Mark as Served"
                    )}
                  </button>
                )}
                {selectedOrder.status === "Waiting for Payment" && (
                  <button
                    className={styles.footerPrimaryBtn}
                    onClick={() => handleBillOrder(selectedOrder.id)}
                    disabled={actionLoading === `bill-${selectedOrder.id}`}
                  >
                    {actionLoading === `bill-${selectedOrder.id}` ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Processing...
                      </>
                    ) : (
                      "Proceed to Payment"
                    )}
                  </button>
                )}
                {selectedOrder.status !== "Ready to Served" && selectedOrder.status !== "Waiting for Payment" && (
                  <button className={styles.footerPrimaryBtn} disabled>
                    Proceed to Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
