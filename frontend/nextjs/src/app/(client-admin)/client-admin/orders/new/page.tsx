"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import styles from "./NewOrder.module.css";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  X,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  Boxes,
  FileText,
  Loader2,
  CreditCard,
  Wallet,
  Banknote,
  Smartphone,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createOrder,
  getOrder,
  addOrderItem,
  billOrder,
  payOrder,
  createPaymentLink,
  getPaymentStatus,
  listMenuItems,
  listMenuCategories,
  listTables,
  listOutlets,
  type OrderResponse,
  type MenuItemResponse,
  type MenuCategoryResponse,
  type PaymentCreateInput,
  type PaymentLinkResponse,
  type PaymentStatusResponse,
  getImageUrl,
} from "@/lib/api/clientAdmin";
import Image from "next/image";
import { useOutlet } from "@/contexts/OutletContext";

type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

type CartLine = {
  menuItem: MenuItemResponse;
  qty: number;
  note?: string;
};

type PaymentMethod = "CASH" | "CARD" | "UPI" | "GATEWAY";

export default function NewOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  
  // Step 1: Customer Information
  const [orderType, setOrderType] = useState<OrderType>("TAKEAWAY");
  const [customerName, setCustomerName] = useState<string>("");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState<string>("");
  
  // Step 2: Select Menu
  const [categoryId, setCategoryId] = useState<string>("all");
  const [query, setQuery] = useState<string>("");
  const [menuItems, setMenuItems] = useState<MenuItemResponse[]>([]);
  const [categories, setCategories] = useState<MenuCategoryResponse[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const { selectedOutletId } = useOutlet();
  const [menuLoading, setMenuLoading] = useState(false);
  
  // Step 3 & 4: Order Summary & Payment
  const [cart, setCart] = useState<CartLine[]>([]);
  const [currentOrder, setCurrentOrder] = useState<OrderResponse | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [addingItems, setAddingItems] = useState(false);
  const [billingOrder, setBillingOrder] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("CASH");
  
  // Payment link and iframe state
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [showPaymentIframe, setShowPaymentIframe] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Modal state
  const [openAddModalFor, setOpenAddModalFor] = useState<MenuItemResponse | null>(null);
  const [addModalQty, setAddModalQty] = useState<number>(1);
  const [addModalNote, setAddModalNote] = useState<string>("");
  
  // Quick add mode - add item directly without modal
  const [quickAddMode, setQuickAddMode] = useState(true);

  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("orderId");
  const outletId = selectedOutletId || "";

  // Load existing order if orderId is provided
  const stepParam = searchParams.get("step");

  useEffect(() => {
    if (orderIdParam) {
      async function loadExistingOrder() {
        try {
          const order = await getOrder(orderIdParam!);
          setCurrentOrder(order);
          
          // Use step from URL if provided, otherwise default to 2
          if (stepParam) {
            const parsedStep = parseInt(stepParam);
            if (parsedStep >= 1 && parsedStep <= 4) {
              setStep(parsedStep as 1 | 2 | 3 | 4);
            } else {
              setStep(2);
            }
          } else {
            setStep(2); // Start from select menu
          }
          
          setOrderType(order.orderType as any);
          setSelectedTableId(order.tableId);
          setOrderNotes(order.notes || "");
        } catch (err) {
          console.error("Failed to load existing order:", err);
          router.push("/client-admin/orders");
        }
      }
      loadExistingOrder();
    }
  }, [orderIdParam, stepParam, router]);
  // Fetch menu categories
  useEffect(() => {
    if (!selectedOutletId) return;
    async function fetchCategories() {
      try {
        const data = await listMenuCategories(outletId);
        setCategories(data || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    }
    fetchCategories();
  }, [outletId]);

  // Fetch menu items
  useEffect(() => {
    if (!outletId) return;
    async function fetchMenuItems() {
      try {
        setMenuLoading(true);
        const params: { status?: string; categoryId?: string } = { status: "ACTIVE" };
        if (categoryId && categoryId !== "all") {
          params.categoryId = categoryId;
        }
        if (!selectedOutletId) return;
        const data = await listMenuItems(selectedOutletId, params);
        setMenuItems(data || []);
      } catch (err) {
        console.error("Failed to fetch menu items:", err);
      } finally {
        setMenuLoading(false);
      }
    }
    fetchMenuItems();
  }, [selectedOutletId, categoryId]);

  // Fetch tables for Dine In
  useEffect(() => {
    if (!selectedOutletId || orderType !== "DINE_IN") return;
    async function fetchTables() {
      try {
        if(!selectedOutletId) return;
        const data = await listTables(selectedOutletId);
        setTables(data || []);
      } catch (err) {
        console.error("Failed to fetch tables:", err);
      }
    }
    fetchTables();
  }, [selectedOutletId, orderType]);

  const filteredMenu = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menuItems.filter((m) => {
      const matchesQuery = !q || m.name.toLowerCase().includes(q);
      return matchesQuery;
    });
  }, [menuItems, query]);

  const subTotal = useMemo(() => {
    const cartSubTotal = cart.reduce((sum, line) => {
      return sum + Number(line.menuItem.basePrice) * line.qty;
    }, 0);
    const existingSubTotal = currentOrder ? Number(currentOrder.subtotal) : 0;
    return cartSubTotal + existingSubTotal;
  }, [cart, currentOrder]);

  const tax = useMemo(() => {
    // For cart items, estimate 12% tax. For existing items, use backend value.
    const cartSubTotal = cart.reduce((sum, line) => {
      return sum + Number(line.menuItem.basePrice) * line.qty;
    }, 0);
    const cartTax = cartSubTotal * 0.12;
    const existingTax = currentOrder ? Number(currentOrder.taxTotal) : 0;
    return cartTax + existingTax;
  }, [cart, currentOrder]);

  const total = useMemo(() => subTotal + tax, [subTotal, tax]);

  const canContinueFromStep1 = orderType && (orderType !== "DINE_IN" || selectedTableId);
  const canContinueFromStep2 = cart.length > 0;

  const resetOrder = () => {
    setCart([]);
    setCurrentOrder(null);
    setStep(1);
  };

  const addLine = (menuItem: MenuItemResponse, qty: number, note?: string) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((p) => p.menuItem.id === menuItem.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], qty: next[existingIdx].qty + qty };
        return next;
      }
      return [...prev, { menuItem, qty, note }];
    });
  };

  const updateLineQty = (lineIndex: number, delta: number) => {
    setCart((prev) => {
      const next = [...prev];
      const target = next[lineIndex];
      const newQty = Math.max(1, target.qty + delta);
      next[lineIndex] = { ...target, qty: newQty };
      return next;
    });
  };

  const removeLine = (lineIndex: number) => {
    setCart((prev) => prev.filter((_, i) => i !== lineIndex));
  };

  const openAddModal = (menuItem: MenuItemResponse) => {
    if (quickAddMode) {
      // Quick add - add directly without modal
      addLine(menuItem, 1);
    } else {
      setOpenAddModalFor(menuItem);
      setAddModalQty(1);
      setAddModalNote("");
    }
  };

  const quickAddWithQty = (menuItem: MenuItemResponse, qty: number) => {
    addLine(menuItem, qty);
  };

  const confirmAddFromModal = () => {
    if (!openAddModalFor) return;
    addLine(openAddModalFor, addModalQty, addModalNote || undefined);
    setOpenAddModalFor(null);
  };
  
  // Auto-focus search on mount
  useEffect(() => {
    if (step === 2) {
      const searchInput = document.querySelector('input[placeholder*="Search Item"]') as HTMLInputElement;
      searchInput?.focus();
    }
  }, [step]);

  const handleCreateOrder = async () => {
    if (!selectedOutletId) return;
    
    try {
      setCreatingOrder(true);
      
      // Create order
      const orderTypeStr = orderType === "DINE_IN" ? "DINE_IN" : orderType === "TAKEAWAY" ? "TAKEAWAY" : "DELIVERY";
      const orderData = await createOrder({
        orderType: orderTypeStr,
        tableId: orderType === "DINE_IN" ? selectedTableId || undefined : undefined,
        customerName: customerName || undefined,
        notes: orderNotes || undefined,
      }, selectedOutletId);
      
      setCurrentOrder(orderData);
      setStep(2);
    } catch (err: any) {
      alert(err?.message || "Failed to create order");
      console.error("Failed to create order:", err);
    } finally {
      setCreatingOrder(false);
      setAddingItems(false);
    }
  };

  // Step 2 -> Step 3: Create order and add items
  const handleProceedToSummary = async () => {
    if (!selectedOutletId || cart.length === 0) return;
    
    try {
      // Add all items to order
      if (!currentOrder) return;
      setAddingItems(true);
      let updatedOrder = currentOrder;
      for (const line of cart) {
        try {
          updatedOrder = await addOrderItem(currentOrder.id, {
            itemId: line.menuItem.id,
            qty: line.qty,
          });
        } catch (err) {
          console.error(`Failed to add item ${line.menuItem.id}:`, err);
        }
      }
      
      setCurrentOrder(updatedOrder);
      setStep(3);
    } catch (err: any) {
      alert(err?.message || "Failed to create order");
      console.error("Failed to create order:", err);
    } finally {
      setCreatingOrder(false);
      setAddingItems(false);
    }
  };

  // Step 3 -> Step 4: Bill order
  const handleProceedToPayment = async () => {
    if (!currentOrder) return;
    
    try {
      setBillingOrder(true);
      const billedOrder = await billOrder(currentOrder.id);
      setCurrentOrder(billedOrder);
      setStep(4);
    } catch (err: any) {
      alert(err?.message || "Failed to bill order");
      console.error("Failed to bill order:", err);
    } finally {
      setBillingOrder(false);
    }
  };

  // Step 4: Process payment
  const handleProcessPayment = async () => {
    if (!currentOrder) return;
    
    try {
      setProcessingPayment(true);
      
      // For GATEWAY payments, create payment link and show iframe
      if (selectedPaymentMethod === "GATEWAY") {
        const idempotencyKey = `payment-link-${currentOrder.id}-${Date.now()}`;
        const linkResponse = await createPaymentLink(currentOrder.id, idempotencyKey);
        
        if (linkResponse.paymentLink) {
          setPaymentLink(linkResponse.paymentLink);
          setShowPaymentIframe(true);
          window.open(linkResponse.paymentLink, "_blank");
          startPaymentStatusPolling(currentOrder.id);
        } else {
          // If no payment link, fallback to regular payment flow
          // Some gateways might not provide payment links
          alert("Payment link not available. Please try a different payment method.");
          setProcessingPayment(false);
        }
      } else {
        // For non-gateway payments (CASH, CARD, UPI), use regular payment flow
        const idempotencyKey = `payment-${currentOrder.id}-${Date.now()}`;
        const paymentInput: PaymentCreateInput = {
          method: selectedPaymentMethod,
          amount: Number(currentOrder.grandTotal),
        };
        
        await payOrder(currentOrder.id, paymentInput, idempotencyKey);
        
        // Redirect to orders page on success
        router.push("/client-admin/orders");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to process payment");
      console.error("Failed to process payment:", err);
      setProcessingPayment(false);
    }
  };

  // Start polling for payment status
  const startPaymentStatusPolling = (orderId: string) => {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 2 seconds
    const interval = setInterval(async () => {
      try {
        const status = await getPaymentStatus(orderId);
        setPaymentStatus(status);

        // Check if payment is completed (success or failure)
        if (status.transactionStatus === "CAPTURED" || 
            status.transactionStatus === "FAILED" ||
            status.orderStatus === "PAID") {
          stopPaymentStatusPolling();
          
          // Close iframe after a short delay
          setTimeout(() => {
            setShowPaymentIframe(false);
            setPaymentLink(null);
            
            if (status.transactionStatus === "CAPTURED" || status.orderStatus === "PAID") {
              // Payment successful
              alert("Payment successful!");
              router.push("/client-admin/orders");
            } else {
              // Payment failed
              alert("Payment failed. Please try again.");
              setProcessingPayment(false);
            }
          }, 1000);
        }
      } catch (err) {
        console.error("Failed to check payment status:", err);
      }
    }, 2000);

    pollingIntervalRef.current = interval;
  };

  // Stop polling for payment status
  const stopPaymentStatusPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Customer Information";
      case 2:
        return "Select Menu";
      case 3:
        return "Order Summary";
      case 4:
        return "Payment";
      default:
        return "";
    }
  };

  const getBreadcrumbTrail = () => {
    const steps = [
      { num: 1, label: "Customer Information" },
      { num: 2, label: "Select Menu" },
      { num: 3, label: "Order Summary" },
      { num: 4, label: "Payment" },
    ];
    return steps;
  };

  return (
    <div className={styles.pageWrap}>
      <div className={styles.topHeader}>
        <button
          className={styles.backBtn}
          onClick={() => {
            if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
            else router.push("/client-admin/orders");
          }}
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>

        <div className={styles.breadcrumbs}>
          <div className={styles.breadcrumbTitle}>{getStepTitle()}</div>
          <div className={styles.breadcrumbTrail}>
            {getBreadcrumbTrail().map((s, idx) => (
              <React.Fragment key={s.num}>
                {idx > 0 && <span className={styles.crumbSep}>&gt;</span>}
                <span
                  className={cn(
                    styles.crumb,
                    step === s.num ? styles.crumbActive : step > s.num ? styles.crumbDone : styles.crumbMuted
                  )}
                >
                  {s.label}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <button className={styles.closeBtn} onClick={() => router.push("/client-admin/orders")} aria-label="Close">
          <X size={18} />
        </button>
      </div>

      {/* Step 1: Customer Information */}
      {step === 1 && (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 20px" }}>
          <div style={{
            width: "min(600px, 95vw)",
            background: "white",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 24,
            padding: 32,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.04)",
          }}>
            <div style={{ textAlign: "center", fontSize: 26, fontWeight: 800, marginBottom: 28, color: "#1e293b" }}>Order Information</div>

            <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginBottom: 12 }}>Order Type</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { value: "DINE_IN", label: "Dine In", icon: "🍽️" },
                { value: "TAKEAWAY", label: "Take Away", icon: "🥡" },
                { value: "DELIVERY", label: "Delivery", icon: "🚚" },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setOrderType(type.value as OrderType)}
                  style={{
                    borderRadius: 16,
                    border: `2px solid ${orderType === type.value ? "#8b5cf6" : "#e2e8f0"}`,
                    background: orderType === type.value ? "rgba(139, 92, 246, 0.05)" : "white",
                    padding: "20px 16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 700,
                    color: orderType === type.value ? "#8b5cf6" : "#64748b",
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: orderType === type.value ? "0 4px 12px rgba(139, 92, 246, 0.2)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (orderType !== type.value) {
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.background = "#f8fafc";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (orderType !== type.value) {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.background = "white";
                    }
                  }}
                >
                  <span style={{ fontSize: 32 }}>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>

            {orderType === "DINE_IN" && (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginBottom: 12, marginTop: 24 }}>
                  Select Table
                </div>
                <select
                  value={selectedTableId || ""}
                  onChange={(e) => setSelectedTableId(e.target.value || null)}
                  style={{
                    width: "100%",
                    height: 48,
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    padding: "0 16px",
                    outline: "none",
                    background: "#f8fafc",
                    fontSize: 14,
                    cursor: "pointer",
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
                >
                  <option value="">-- Select Table --</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.displayName} ({table.tableCode})
                    </option>
                  ))}
                </select>
              </>
            )}

            <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginBottom: 12, marginTop: 24 }}>
              Customer Name (Optional)
            </div>
            <input
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                padding: "0 16px",
                outline: "none",
                background: "#f8fafc",
                fontSize: 14,
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

            <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginBottom: 12, marginTop: 24 }}>
              Notes (Optional)
            </div>
            <textarea
              placeholder="Any special instructions..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                padding: "12px 16px",
                outline: "none",
                background: "#f8fafc",
                fontSize: 14,
                fontFamily: "inherit",
                resize: "vertical",
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

            <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 28 }}>
              <button
                disabled={!canContinueFromStep1 || creatingOrder}
                onClick={() => handleCreateOrder()}
                style={{
                  height: 52,
                  padding: "0 28px",
                  borderRadius: 14,
                  background: !canContinueFromStep1 || creatingOrder
                    ? "#e2e8f0"
                    : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                  color: !canContinueFromStep1 || creatingOrder ? "#94a3b8" : "white",
                  fontWeight: 700,
                  fontSize: 15,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  boxShadow: !canContinueFromStep1 || creatingOrder
                    ? "none"
                    : "0 4px 14px rgba(139, 92, 246, 0.35)",
                  border: "none",
                  cursor: !canContinueFromStep1 || creatingOrder ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (canContinueFromStep1 && !creatingOrder) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.45)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = !canContinueFromStep1 || creatingOrder
                    ? "none"
                    : "0 4px 14px rgba(139, 92, 246, 0.35)";
                }}
              >
                {creatingOrder ? (
                  <><Loader2 size={18} className="animate-spin" /> Creating...</>
                ) : (
                  <>Continue <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Select Menu */}
      {step === 2 && (
        <div className={styles.twoCol} style={{ marginTop: 20 }}>
          <div className={styles.leftPanel}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              paddingBottom: 16,
              borderBottom: "1px solid #f1f5f9",
              marginBottom: 16,
            }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 16 }}>
                <Boxes size={20} style={{ color: "#8b5cf6" }} />
                <span>Menu List</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={quickAddMode}
                    onChange={(e) => setQuickAddMode(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                  Quick Add
                </label>
                <div style={{
                  position: "relative",
                  flex: 1,
                  minWidth: 280,
                  maxWidth: 400,
                }}>
                  <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Item Name (Type to search)"
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 44px",
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
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
              </div>
            </div>

            <div style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              paddingBottom: 16,
              marginBottom: 16,
              scrollbarWidth: "thin",
            }}>
              <button
                onClick={() => setCategoryId("all")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  borderRadius: 20,
                  border: `1px solid ${categoryId === "all" ? "rgba(139, 92, 246, 0.3)" : "rgba(0,0,0,0.08)"}`,
                  background: categoryId === "all" ? "rgba(139, 92, 246, 0.12)" : "white",
                  color: categoryId === "all" ? "#8b5cf6" : "#64748b",
                  fontWeight: 700,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (categoryId !== "all") {
                    e.currentTarget.style.background = "#f8fafc";
                  }
                }}
                onMouseLeave={(e) => {
                  if (categoryId !== "all") {
                    e.currentTarget.style.background = "white";
                  }
                }}
              >
                <span>All</span>
                <span style={{
                  minWidth: 26,
                  height: 20,
                  padding: "0 8px",
                  borderRadius: 20,
                  background: categoryId === "all" ? "#8b5cf6" : "rgba(100, 116, 139, 0.12)",
                  color: categoryId === "all" ? "white" : "#64748b",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {menuItems.length}
                </span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 16px",
                    borderRadius: 20,
                    border: `1px solid ${categoryId === cat.id ? "rgba(139, 92, 246, 0.3)" : "rgba(0,0,0,0.08)"}`,
                    background: categoryId === cat.id ? "rgba(139, 92, 246, 0.12)" : "white",
                    color: categoryId === cat.id ? "#8b5cf6" : "#64748b",
                    fontWeight: 700,
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (categoryId !== cat.id) {
                      e.currentTarget.style.background = "#f8fafc";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (categoryId !== cat.id) {
                      e.currentTarget.style.background = "white";
                    }
                  }}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {menuLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                <Loader2 size={32} className="animate-spin" />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                {filteredMenu.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: 16,
                      border: "1px solid #e2e8f0",
                      overflow: "hidden",
                      background: "white",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ position: "relative", height: 140 }}>
                      {item.images && item.images.length > 0 ? (
                        <Image
                          src={getImageUrl(item.images[0].imageUrl) || ""}
                          alt={item.name}
                          width={240}
                          height={140}
                          style={{ objectFit: "cover", width: "100%", height: "100%" }}
                        />
                      ) : (
                        <div style={{
                          width: "100%",
                          height: "100%",
                          background: "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#94a3b8",
                          fontSize: 12,
                          fontWeight: 600,
                        }}>
                          No Image
                        </div>
                      )}
                      <div style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 20,
                        background: item.status === "ACTIVE" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        backdropFilter: "blur(10px)",
                        fontSize: 11,
                        fontWeight: 700,
                        color: item.status === "ACTIVE" ? "#10b981" : "#ef4444",
                      }}>
                        <span style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: item.status === "ACTIVE" ? "#10b981" : "#ef4444",
                        }} />
                        {item.status === "ACTIVE" ? "Available" : "Unavailable"}
                      </div>
                    </div>

                    <div style={{ padding: 16 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: "#1e293b" }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b", minHeight: 32, marginBottom: 12 }}>
                        {item.description || "No description"}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#8b5cf6" }}>₹{Number(item.basePrice).toFixed(2)}</div>
                        {quickAddMode ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => quickAddWithQty(item, 1)}
                              disabled={item.status !== "ACTIVE"}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 10,
                                border: "none",
                                background: item.status === "ACTIVE" ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" : "#e2e8f0",
                                color: item.status === "ACTIVE" ? "white" : "#94a3b8",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: item.status === "ACTIVE" ? "pointer" : "not-allowed",
                                transition: "all 0.2s ease",
                                boxShadow: item.status === "ACTIVE" ? "0 2px 8px rgba(139, 92, 246, 0.3)" : "none",
                              }}
                              onMouseEnter={(e) => {
                                if (item.status === "ACTIVE") {
                                  e.currentTarget.style.transform = "scale(1.05)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                            >
                              +1
                            </button>
                            <button
                              onClick={() => quickAddWithQty(item, 2)}
                              disabled={item.status !== "ACTIVE"}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 10,
                                border: "none",
                                background: item.status === "ACTIVE" ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" : "#e2e8f0",
                                color: item.status === "ACTIVE" ? "white" : "#94a3b8",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: item.status === "ACTIVE" ? "pointer" : "not-allowed",
                                transition: "all 0.2s ease",
                                boxShadow: item.status === "ACTIVE" ? "0 2px 8px rgba(99, 102, 241, 0.3)" : "none",
                              }}
                              onMouseEnter={(e) => {
                                if (item.status === "ACTIVE") {
                                  e.currentTarget.style.transform = "scale(1.05)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                            >
                              +2
                            </button>
                            <button
                              onClick={() => openAddModal(item)}
                              disabled={item.status !== "ACTIVE"}
                              style={{
                                padding: "8px 10px",
                                borderRadius: 10,
                                border: "1px solid #e2e8f0",
                                background: item.status === "ACTIVE" ? "white" : "#f1f5f9",
                                color: item.status === "ACTIVE" ? "#64748b" : "#94a3b8",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: item.status === "ACTIVE" ? "pointer" : "not-allowed",
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                if (item.status === "ACTIVE") {
                                  e.currentTarget.style.background = "#f8fafc";
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = item.status === "ACTIVE" ? "white" : "#f1f5f9";
                              }}
                              title="Custom quantity"
                            >
                              ...
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openAddModal(item)}
                            disabled={item.status !== "ACTIVE"}
                            style={{
                              padding: "10px 16px",
                              borderRadius: 10,
                              border: "none",
                              background: item.status === "ACTIVE" ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" : "#e2e8f0",
                              color: item.status === "ACTIVE" ? "white" : "#94a3b8",
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: item.status === "ACTIVE" ? "pointer" : "not-allowed",
                              transition: "all 0.2s ease",
                              boxShadow: item.status === "ACTIVE" ? "0 2px 8px rgba(139, 92, 246, 0.3)" : "none",
                            }}
                            onMouseEnter={(e) => {
                              if (item.status === "ACTIVE") {
                                e.currentTarget.style.transform = "translateY(-1px)";
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.4)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = item.status === "ACTIVE" ? "0 2px 8px rgba(139, 92, 246, 0.3)" : "none";
                            }}
                          >
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.rightPanel} style={{ position: "sticky", top: 20, maxHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              paddingBottom: 16,
              borderBottom: "1px solid #f1f5f9",
              marginBottom: 16,
            }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 16 }}>
                <FileText size={20} style={{ color: "#8b5cf6" }} />
                <span>Order Details</span>
              </div>
              <button
                onClick={resetOrder}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  color: "#ef4444",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fee2e2";
                  e.currentTarget.style.borderColor = "#fca5a5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fef2f2";
                  e.currentTarget.style.borderColor = "#fecaca";
                }}
              >
                <Trash2 size={16} /> Reset
              </button>
            </div>

            <div style={{
              flex: 1,
              minHeight: 0,
              marginTop: 12,
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              background: "#f8fafc",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}>
              {cart.length === 0 && (!currentOrder || currentOrder.items.length === 0) ? (
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
                    background: "white",
                  }}>
                    <ShoppingCart size={32} style={{ color: "#cbd5e1" }} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>No items in cart</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    Select menu items from the list and add to cart
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  overflowY: "auto",
                  flex: 1,
                }}>
                  {/* Existing Items */}
                  {currentOrder && currentOrder.items.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Existing Items</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {currentOrder.items.map((item) => (
                          <div key={item.id} style={{ padding: "10px 12px", background: "white", borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                              {item.itemName} <span style={{ color: "#64748b", fontWeight: 500 }}>x {Number(item.qty)}</span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>₹{Number(item.lineTotal).toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Items (Cart) */}
                  {cart.length > 0 && (
                    <div style={{ marginTop: currentOrder && currentOrder.items.length > 0 ? 8 : 0 }}>
                      {currentOrder && currentOrder.items.length > 0 && (
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#8b5cf6", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>New Items</div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {cart.map((line, idx) => (
                          <div
                            key={`${line.menuItem.id}-${idx}`}
                            style={{
                              borderRadius: 14,
                              border: "1px solid #e2e8f0",
                              background: "white",
                              padding: 14,
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <div style={{ display: "grid", gridTemplateColumns: "64px 1fr 32px", gap: 12, alignItems: "start", marginBottom: 12 }}>
                              {line.menuItem.images && line.menuItem.images.length > 0 ? (
                                <Image
                                  src={getImageUrl(line.menuItem.images[0].imageUrl) || ""}
                                  alt={line.menuItem.name}
                                  width={64}
                                  height={64}
                                  style={{ objectFit: "cover", borderRadius: 12, border: "1px solid #e2e8f0" }}
                                />
                              ) : (
                                <div style={{
                                  width: 64,
                                  height: 64,
                                  borderRadius: 12,
                                  background: "#f1f5f9",
                                  border: "1px solid #e2e8f0",
                                }} />
                              )}
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{line.menuItem.name}</div>
                                {line.note && (
                                  <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>Note: {line.note}</div>
                                )}
                              </div>
                              <button
                                onClick={() => removeLine(idx)}
                                aria-label="Remove"
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  background: "rgba(239, 68, 68, 0.1)",
                                  color: "#ef4444",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  border: "none",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                              <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>₹{Number(line.menuItem.basePrice).toFixed(2)}</div>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                                <button
                                  onClick={() => updateLineQty(idx, -1)}
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: "#f1f5f9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "#e2e8f0";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "#f1f5f9";
                                  }}
                                >
                                  <Minus size={16} style={{ color: "#64748b" }} />
                                </button>
                                <div style={{
                                  width: 40,
                                  textAlign: "center",
                                  fontSize: 16,
                                  fontWeight: 800,
                                  color: "#1e293b",
                                }}>
                                  {line.qty}
                                </div>
                                <button
                                  onClick={() => updateLineQty(idx, 1)}
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: "#f1f5f9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "#e2e8f0";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "#f1f5f9";
                                  }}
                                >
                                  <Plus size={16} style={{ color: "#64748b" }} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{
              marginTop: 16,
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              background: "white",
              padding: 20,
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#64748b",
                fontWeight: 600,
                padding: "8px 0",
                fontSize: 14,
              }}>
                <span>Sub Total</span>
                <span>₹{subTotal.toFixed(2)}</span>
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#64748b",
                fontWeight: 600,
                padding: "8px 0",
                fontSize: 14,
              }}>
                <span>Tax (Est.)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div style={{
                height: 1,
                background: "#e2e8f0",
                margin: "12px 0",
              }} />
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontWeight: 800,
                color: "#1e293b",
                fontSize: 20,
              }}>
                <span>Total Payment</span>
                <span style={{ fontSize: 24, color: "#8b5cf6" }}>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              disabled={!canContinueFromStep2 || creatingOrder || addingItems}
              onClick={handleProceedToSummary}
              style={{
                marginTop: 16,
                height: 52,
                borderRadius: 14,
                background: !canContinueFromStep2 || creatingOrder || addingItems
                  ? "#e2e8f0"
                  : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                color: !canContinueFromStep2 || creatingOrder || addingItems ? "#94a3b8" : "white",
                fontWeight: 700,
                fontSize: 15,
                boxShadow: !canContinueFromStep2 || creatingOrder || addingItems
                  ? "none"
                  : "0 4px 14px rgba(139, 92, 246, 0.35)",
                border: "none",
                cursor: !canContinueFromStep2 || creatingOrder || addingItems ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => {
                if (canContinueFromStep2 && !creatingOrder && !addingItems) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.45)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = !canContinueFromStep2 || creatingOrder || addingItems
                  ? "none"
                  : "0 4px 14px rgba(139, 92, 246, 0.35)";
              }}
            >
              {creatingOrder || addingItems ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Processing...
                </>
              ) : (
                <>
                  Continue to Summary <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Order Summary */}
      {step === 3 && currentOrder && (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 20px" }}>
          <div style={{
            width: "min(600px, 95vw)",
            background: "white",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 24,
            padding: 32,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.04)",
          }}>
            <div style={{ textAlign: "center", fontSize: 26, fontWeight: 800, marginBottom: 28, color: "#1e293b" }}>Order Summary</div>

            <div style={{ marginBottom: 24, padding: 20, background: "#f8fafc", borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 600 }}>Order ID</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{currentOrder.id}</div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginBottom: 12 }}>Order Type</div>
              <div style={{
                display: "inline-block",
                padding: "8px 16px",
                borderRadius: 20,
                background: "rgba(139, 92, 246, 0.1)",
                color: "#8b5cf6",
                fontSize: 14,
                fontWeight: 700,
              }}>
                {currentOrder.orderType === "DINE_IN"
                  ? "Dine In"
                  : currentOrder.orderType === "TAKEAWAY"
                  ? "Take Away"
                  : "Delivery"}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginBottom: 12 }}>Items ({currentOrder.items.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {currentOrder.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 16px",
                      background: "#f8fafc",
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
                      {item.itemName} <span style={{ color: "#64748b", fontWeight: 500 }}>x {Number(item.qty)}</span>
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>₹{Number(item.lineTotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 28, padding: 20, background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14, color: "#64748b", fontWeight: 600 }}>
                <span>Subtotal:</span>
                <span>₹{Number(currentOrder.subtotal).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14, color: "#64748b", fontWeight: 600 }}>
                <span>Tax:</span>
                <span>₹{Number(currentOrder.taxTotal).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 14, color: "#64748b", fontWeight: 600 }}>
                <span>Discount:</span>
                <span>₹{Number(currentOrder.discountTotal).toFixed(2)}</span>
              </div>
              <div style={{
                height: 1,
                background: "#e2e8f0",
                marginBottom: 16,
              }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 800, color: "#1e293b" }}>
                <span>Grand Total:</span>
                <span style={{ fontSize: 28, color: "#8b5cf6" }}>₹{Number(currentOrder.grandTotal).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <button
                disabled={billingOrder}
                onClick={handleProceedToPayment}
                style={{
                  height: 52,
                  padding: "0 28px",
                  borderRadius: 14,
                  background: billingOrder
                    ? "#e2e8f0"
                    : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                  color: billingOrder ? "#94a3b8" : "white",
                  fontWeight: 700,
                  fontSize: 15,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  boxShadow: billingOrder
                    ? "none"
                    : "0 4px 14px rgba(139, 92, 246, 0.35)",
                  border: "none",
                  cursor: billingOrder ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!billingOrder) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.45)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = billingOrder
                    ? "none"
                    : "0 4px 14px rgba(139, 92, 246, 0.35)";
                }}
              >
                {billingOrder ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    Proceed to Payment <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Payment */}
      {step === 4 && currentOrder && (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 20px" }}>
          {showPaymentIframe && paymentLink ? (
            // Payment iframe view
            <div style={{
              width: "min(800px, 95vw)",
              height: "600px",
              display: "flex",
              flexDirection: "column",
              background: "white",
              borderRadius: 24,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}>
              <div style={{
                padding: "20px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Complete Payment</div>
                  <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
                    Amount: <strong style={{ color: "#1e293b" }}>₹{Number(currentOrder.grandTotal).toFixed(2)}</strong>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {paymentStatus && (
                    <div style={{
                      padding: "10px 16px",
                      borderRadius: 12,
                      background: paymentStatus.transactionStatus === "CAPTURED" ? "rgba(16, 185, 129, 0.1)" :
                                 paymentStatus.transactionStatus === "FAILED" ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)",
                      color: paymentStatus.transactionStatus === "CAPTURED" ? "#10b981" :
                             paymentStatus.transactionStatus === "FAILED" ? "#ef4444" : "#f59e0b",
                      fontSize: 13,
                      fontWeight: 700,
                      border: `1px solid ${paymentStatus.transactionStatus === "CAPTURED" ? "rgba(16, 185, 129, 0.2)" :
                               paymentStatus.transactionStatus === "FAILED" ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)"}`,
                    }}>
                      {paymentStatus.transactionStatus === "CAPTURED" ? "✓ Payment Successful" :
                       paymentStatus.transactionStatus === "FAILED" ? "✗ Payment Failed" :
                       paymentStatus.transactionStatus === "PENDING" ? "⏳ Processing..." :
                       "Checking status..."}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      stopPaymentStatusPolling();
                      setShowPaymentIframe(false);
                      setPaymentLink(null);
                      setProcessingPayment(false);
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: "#111827",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#374151";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#111827";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px",
                textAlign: "center",
              }}>
                <div style={{ marginBottom: 24, fontSize: 16, color: "#64748b" }}>
                  Payment page has been opened in a new tab.<br/>
                  Please complete the payment there.
                </div>
                <button
                  onClick={() => window.open(paymentLink, '_blank')}
                  style={{
                    padding: "12px 24px",
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
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
                  Click to open again
                </button>
              </div>
            </div>
          ) : (
            // Payment method selection view
            <div style={{
              width: "min(600px, 95vw)",
              background: "white",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 24,
              padding: 32,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.04)",
            }}>
              <div style={{ textAlign: "center", fontSize: 26, fontWeight: 800, marginBottom: 28, color: "#1e293b" }}>Payment</div>

              <div style={{ marginBottom: 32, textAlign: "center" }}>
                <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8, fontWeight: 600 }}>Total Amount</div>
                <div style={{ fontSize: 42, fontWeight: 800, color: "#8b5cf6" }}>
                  ₹{Number(currentOrder.grandTotal).toFixed(2)}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginBottom: 12 }}>Order Items ({currentOrder.items.length})</div>
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 8, 
                  maxHeight: "200px", 
                  overflowY: "auto",
                  padding: "4px",
                  marginBottom: 16
                }}>
                  {currentOrder.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        background: "#f8fafc",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                        {item.itemName} <span style={{ color: "#64748b", fontWeight: 500 }}>x {Number(item.qty)}</span>
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>₹{Number(item.lineTotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginBottom: 16 }}>Payment Method</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 32 }}>
                {[
                  { value: "CASH", label: "Cash", icon: Banknote, color: "#10b981" },
                  { value: "CARD", label: "Card", icon: CreditCard, color: "#3b82f6" },
                  { value: "UPI", label: "UPI", icon: Smartphone, color: "#8b5cf6" },
                  { value: "GATEWAY", label: "Online", icon: Wallet, color: "#f59e0b" },
                ].map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.value}
                      onClick={() => setSelectedPaymentMethod(method.value as PaymentMethod)}
                      disabled={processingPayment}
                      style={{
                        borderRadius: 16,
                        border: `2px solid ${selectedPaymentMethod === method.value ? method.color : "#e2e8f0"}`,
                        background: selectedPaymentMethod === method.value ? `${method.color}15` : "white",
                        padding: "24px 20px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 12,
                        fontWeight: 700,
                        color: selectedPaymentMethod === method.value ? method.color : "#64748b",
                        fontSize: 14,
                        cursor: processingPayment ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: selectedPaymentMethod === method.value ? `0 4px 12px ${method.color}30` : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!processingPayment && selectedPaymentMethod !== method.value) {
                          e.currentTarget.style.borderColor = "#cbd5e1";
                          e.currentTarget.style.background = "#f8fafc";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedPaymentMethod !== method.value) {
                          e.currentTarget.style.borderColor = "#e2e8f0";
                          e.currentTarget.style.background = "white";
                        }
                      }}
                    >
                      <Icon size={32} style={{ color: selectedPaymentMethod === method.value ? method.color : "#64748b" }} />
                      <span>{method.label}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <button
                  disabled={processingPayment}
                  onClick={handleProcessPayment}
                  style={{
                    height: 52,
                    padding: "0 28px",
                    borderRadius: 14,
                    background: processingPayment
                      ? "#e2e8f0"
                      : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                    color: processingPayment ? "#94a3b8" : "white",
                    fontWeight: 700,
                    fontSize: 15,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    boxShadow: processingPayment
                      ? "none"
                      : "0 4px 14px rgba(139, 92, 246, 0.35)",
                    border: "none",
                    cursor: processingPayment ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!processingPayment) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.45)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = processingPayment
                      ? "none"
                      : "0 4px 14px rgba(139, 92, 246, 0.35)";
                  }}
                >
                  {processingPayment ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Processing Payment...
                    </>
                  ) : (
                    <>
                      {selectedPaymentMethod === "GATEWAY" ? "Proceed to Payment" : "Complete Payment"} <Check size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Item Modal */}
      {openAddModalFor && (
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
            animation: "fadeIn 0.2s ease",
          }}
          onMouseDown={() => setOpenAddModalFor(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              width: "min(520px, 96vw)",
              maxHeight: "86vh",
              background: "white",
              borderRadius: 24,
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              animation: "slideUp 0.3s ease",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #f1f5f9",
              background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
            }}>
              <div style={{ fontWeight: 800, fontSize: 18, display: "inline-flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 24 }}>🛒</span> Add to Cart
              </div>
              <button
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  background: "#111827",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={() => setOpenAddModalFor(null)}
                aria-label="Close"
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
              display: "grid",
              gridTemplateColumns: "100px 1fr auto",
              gap: 16,
              padding: "20px 24px",
            }}>
              {openAddModalFor.images && openAddModalFor.images.length > 0 ? (
                <Image
                  src={getImageUrl(openAddModalFor.images[0].imageUrl) || ""}
                  alt={openAddModalFor.name}
                  width={100}
                  height={100}
                  style={{ objectFit: "cover", borderRadius: 14, border: "1px solid #e2e8f0" }}
                />
              ) : (
                <div style={{
                  width: 100,
                  height: 100,
                  borderRadius: 14,
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
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: "#1e293b" }}>{openAddModalFor.name}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{openAddModalFor.description || "No description"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>Base Price</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#8b5cf6" }}>₹{Number(openAddModalFor.basePrice).toFixed(2)}</div>
              </div>
            </div>

            <div style={{ padding: "0 24px 20px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#64748b" }}>Special Instructions (Optional)</div>
              <textarea
                placeholder="Add any special instructions..."
                value={addModalNote}
                onChange={(e) => setAddModalNote(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  padding: "12px 16px",
                  outline: "none",
                  background: "#f8fafc",
                  fontSize: 14,
                  fontFamily: "inherit",
                  resize: "vertical",
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

            <div style={{
              padding: "20px 24px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={() => setAddModalQty((q) => Math.max(1, q - 1))}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#e2e8f0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f1f5f9";
                  }}
                >
                  <Minus size={18} style={{ color: "#64748b" }} />
                </button>
                <div style={{
                  width: 50,
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#1e293b",
                }}>
                  {addModalQty}
                </div>
                <button
                  onClick={() => setAddModalQty((q) => q + 1)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#e2e8f0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f1f5f9";
                  }}
                >
                  <Plus size={18} style={{ color: "#64748b" }} />
                </button>
              </div>

              <button
                onClick={confirmAddFromModal}
                style={{
                  height: 44,
                  padding: "0 24px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow: "0 4px 14px rgba(139, 92, 246, 0.35)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(139, 92, 246, 0.35)";
                }}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

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
