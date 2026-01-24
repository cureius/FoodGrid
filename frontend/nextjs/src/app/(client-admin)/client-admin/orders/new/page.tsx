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
import { useRouter } from "next/navigation";
import {
  createOrder,
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

  const outletId = selectedOutletId || "";
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
    return cart.reduce((sum, line) => {
      return sum + Number(line.menuItem.basePrice) * line.qty;
    }, 0);
  }, [cart]);

  const tax = useMemo(() => {
    // Tax is calculated by backend, but we'll estimate for display
    return subTotal * 0.12; // 12% tax estimate
  }, [subTotal]);

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
    setOpenAddModalFor(menuItem);
    setAddModalQty(1);
    setAddModalNote("");
  };

  const confirmAddFromModal = () => {
    if (!openAddModalFor) return;
    addLine(openAddModalFor, addModalQty, addModalNote || undefined);
    setOpenAddModalFor(null);
  };

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
        <div className={styles.centerStage}>
          <div className={styles.orderInfoCard}>
            <div className={styles.formTitle}>Order Information</div>

            <div className={styles.fieldLabel}>Order Type</div>
            <div className={styles.typeGrid}>
              <button
                className={cn(styles.typeCard, orderType === "DINE_IN" && styles.typeCardActive)}
                onClick={() => setOrderType("DINE_IN")}
              >
                <span>Dine In</span>
              </button>
              <button
                className={cn(styles.typeCard, orderType === "TAKEAWAY" && styles.typeCardActive)}
                onClick={() => setOrderType("TAKEAWAY")}
              >
                <span>Take Away</span>
              </button>
              <button
                className={cn(styles.typeCard, orderType === "DELIVERY" && styles.typeCardActive)}
                onClick={() => setOrderType("DELIVERY")}
              >
                <span>Delivery</span>
              </button>
            </div>

            {orderType === "DINE_IN" && (
              <>
                <div className={styles.fieldLabel} style={{ marginTop: 16 }}>
                  Select Table
                </div>
                <select
                  className={styles.textInput}
                  value={selectedTableId || ""}
                  onChange={(e) => setSelectedTableId(e.target.value || null)}
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

            <div className={styles.fieldLabel} style={{ marginTop: 16 }}>
              Customer Name
            </div>
            <input
              className={styles.textInput}
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            <div className={styles.fieldLabel} style={{ marginTop: 16 }}>
              Notes (Optional)
            </div>
            <textarea
              className={styles.textInput}
              placeholder="Any special instructions..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              rows={3}
            />

            <div className={styles.formActions}>
              <button
                className={styles.primaryCta}
                disabled={!canContinueFromStep1}
                onClick={() => handleCreateOrder()}
              >
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Select Menu */}
      {step === 2 && (
        <div className={styles.twoCol}>
          <div className={styles.leftPanel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}>
                <Boxes size={18} />
                <span>Menu List</span>
              </div>
              <div className={styles.panelSearch}>
                <Search size={18} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Item Name"
                />
              </div>
            </div>

            <div className={styles.chipsRow}>
              <button
                className={cn(styles.chip, categoryId === "all" && styles.chipActive)}
                onClick={() => setCategoryId("all")}
              >
                <span>All</span>
                <span className={styles.chipCount}>{menuItems.length}</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={cn(styles.chip, categoryId === cat.id && styles.chipActive)}
                  onClick={() => setCategoryId(cat.id)}
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
              <div className={styles.menuGrid}>
                {filteredMenu.map((item) => (
                  <div key={item.id} className={styles.menuCard}>
                    <div className={styles.menuImageWrap}>
                      {item.images && item.images.length > 0 ? (
                        <Image
                          src={getImageUrl(item.images[0].imageUrl) || ""}
                          alt={item.name}
                          className={styles.menuImage}
                          width={200}
                          height={150}
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div className={styles.menuImage} style={{ background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          No Image
                        </div>
                      )}
                      <div className={cn(styles.availability, item.status === "ACTIVE" ? styles.availOk : styles.availNo)}>
                        <span className={styles.dot} />
                        {item.status === "ACTIVE" ? "Available" : "Not Available"}
                      </div>
                    </div>

                    <div className={styles.menuBody}>
                      <div className={styles.menuName}>{item.name}</div>
                      <div className={styles.menuDesc}>{item.description || "No description"}</div>

                      <div className={styles.menuFooter}>
                        <div className={styles.menuPrice}>₹{Number(item.basePrice).toFixed(2)}</div>
                        <button
                          className={styles.addToCartBtn}
                          disabled={item.status !== "ACTIVE"}
                          onClick={() => openAddModal(item)}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.rightPanel}>
            <div className={styles.rightHeader}>
              <div className={styles.rightHeaderTitle}>
                <FileText size={18} />
                <span>Order Details</span>
              </div>
              <button className={styles.resetBtn} onClick={resetOrder}>
                <Trash2 size={18} /> Reset Order
              </button>
            </div>

            <div className={styles.cartBox}>
              {cart.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <ShoppingCart size={28} />
                  </div>
                  <div className={styles.emptyTitle}>No items in cart</div>
                  <div className={styles.emptySub}>
                    Select menu items from the list and <b>Add to Cart</b>.
                  </div>
                </div>
              ) : (
                <div className={styles.cartList}>
                  {cart.map((line, idx) => (
                    <div key={`${line.menuItem.id}-${idx}`} className={styles.cartLine}>
                      <div className={styles.cartTopRow}>
                        {line.menuItem.images && line.menuItem.images.length > 0 ? (
                          <Image
                            className={styles.cartThumb}
                            src={getImageUrl(line.menuItem.images[0].imageUrl) || ""}
                            alt={line.menuItem.name}
                            width={60}
                            height={60}
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div className={styles.cartThumb} style={{ background: "#f0f0f0" }} />
                        )}
                        <div className={styles.cartInfo}>
                          <div className={styles.cartName}>{line.menuItem.name}</div>
                          {line.note && <div className={styles.cartNote}>Note: {line.note}</div>}
                        </div>
                        <button className={styles.trashBtn} onClick={() => removeLine(idx)} aria-label="Remove">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className={styles.cartBottomRow}>
                        <div className={styles.cartPrice}>₹{Number(line.menuItem.basePrice).toFixed(2)}</div>
                        <div className={styles.qtyPills}>
                          <button className={styles.qtyBtn} onClick={() => updateLineQty(idx, -1)}>
                            <Minus size={16} />
                          </button>
                          <div className={styles.qtyVal}>{line.qty}</div>
                          <button className={styles.qtyBtn} onClick={() => updateLineQty(idx, 1)}>
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryRow}>
                <span>Sub Total</span>
                <span>₹{subTotal.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Tax (Est.)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={styles.summaryTotal}>
                <span>Total Payment</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              className={styles.continueBtn}
              disabled={!canContinueFromStep2 || creatingOrder || addingItems}
              onClick={handleProceedToSummary}
            >
              {creatingOrder || addingItems ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Processing...
                </>
              ) : (
                "Continue to Summary"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Order Summary */}
      {step === 3 && currentOrder && (
        <div className={styles.centerStage}>
          <div className={styles.orderInfoCard}>
            <div className={styles.formTitle}>Order Summary</div>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Order ID</div>
              <div style={{ fontSize: "18px", fontWeight: "bold" }}>{currentOrder.id}</div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Order Type</div>
              <div style={{ fontSize: "16px" }}>
                {currentOrder.orderType === "DINE_IN"
                  ? "Dine In"
                  : currentOrder.orderType === "TAKEAWAY"
                  ? "Take Away"
                  : "Delivery"}
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Items</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {currentOrder.items.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px", background: "#f9f9f9", borderRadius: "8px" }}>
                    <span>{item.itemName} x {Number(item.qty)}</span>
                    <span>₹{Number(item.lineTotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "24px", padding: "16px", background: "#f0f0f0", borderRadius: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>Subtotal:</span>
                <span>₹{Number(currentOrder.subtotal).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>Tax:</span>
                <span>₹{Number(currentOrder.taxTotal).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>Discount:</span>
                <span>₹{Number(currentOrder.discountTotal).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "bold", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #ccc" }}>
                <span>Grand Total:</span>
                <span>₹{Number(currentOrder.grandTotal).toFixed(2)}</span>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                className={styles.primaryCta}
                disabled={billingOrder}
                onClick={handleProceedToPayment}
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
        <div className={styles.centerStage}>
          {showPaymentIframe && paymentLink ? (
            // Payment iframe view
            <div style={{ 
              width: "100%", 
              maxWidth: "800px", 
              height: "600px", 
              display: "flex", 
              flexDirection: "column",
              background: "#fff",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <div style={{ 
                padding: "16px", 
                borderBottom: "1px solid #e0e0e0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "bold" }}>Complete Payment</div>
                  <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                    Amount: ₹{Number(currentOrder.grandTotal).toFixed(2)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {paymentStatus && (
                    <div style={{ 
                      padding: "8px 16px", 
                      borderRadius: "4px",
                      background: paymentStatus.transactionStatus === "CAPTURED" ? "#d4edda" : 
                                 paymentStatus.transactionStatus === "FAILED" ? "#f8d7da" : "#fff3cd",
                      color: paymentStatus.transactionStatus === "CAPTURED" ? "#155724" : 
                             paymentStatus.transactionStatus === "FAILED" ? "#721c24" : "#856404",
                      fontSize: "14px",
                      fontWeight: "500"
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
                      padding: "8px",
                      background: "transparent",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
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
                padding: "20px",
                textAlign: "center"
              }}>
                <div style={{ marginBottom: "20px", fontSize: "16px", color: "#555" }}>
                  Payment page has been opened in a new tab.<br/>
                  Please complete the payment there.
                </div>
                <button 
                  onClick={() => window.open(paymentLink, '_blank')}
                  className={styles.primaryCta}
                  style={{ width: "auto", padding: "10px 20px" }}
                >
                  Click to open again
                </button>
              </div>
            </div>
          ) : (
            // Payment method selection view
            <div className={styles.orderInfoCard}>
              <div className={styles.formTitle}>Payment</div>

              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Total Amount</div>
                <div style={{ fontSize: "32px", fontWeight: "bold", color: "#2563eb" }}>
                  ₹{Number(currentOrder.grandTotal).toFixed(2)}
                </div>
              </div>

              <div className={styles.fieldLabel} style={{ marginTop: 24 }}>Payment Method</div>
              <div className={styles.typeGrid} style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                <button
                  className={cn(styles.typeCard, selectedPaymentMethod === "CASH" && styles.typeCardActive)}
                  onClick={() => setSelectedPaymentMethod("CASH")}
                  disabled={processingPayment}
                >
                  <Banknote size={24} />
                  <span>Cash</span>
                </button>
                <button
                  className={cn(styles.typeCard, selectedPaymentMethod === "CARD" && styles.typeCardActive)}
                  onClick={() => setSelectedPaymentMethod("CARD")}
                  disabled={processingPayment}
                >
                  <CreditCard size={24} />
                  <span>Card</span>
                </button>
                <button
                  className={cn(styles.typeCard, selectedPaymentMethod === "UPI" && styles.typeCardActive)}
                  onClick={() => setSelectedPaymentMethod("UPI")}
                  disabled={processingPayment}
                >
                  <Smartphone size={24} />
                  <span>UPI</span>
                </button>
                <button
                  className={cn(styles.typeCard, selectedPaymentMethod === "GATEWAY" && styles.typeCardActive)}
                  onClick={() => setSelectedPaymentMethod("GATEWAY")}
                  disabled={processingPayment}
                >
                  <Wallet size={24} />
                  <span>Online</span>
                </button>
              </div>

              <div className={styles.formActions}>
                <button
                  className={styles.primaryCta}
                  disabled={processingPayment}
                  onClick={handleProcessPayment}
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
        <div className={styles.modalOverlay} onMouseDown={() => setOpenAddModalFor(null)} role="dialog" aria-modal="true">
          <div className={styles.addModal} onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.addModalHeader}>
              <div className={styles.addModalTitle}>
                <span className={styles.cartGlyph}>🛒</span> Add to Cart
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setOpenAddModalFor(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className={styles.addModalTop}>
              {openAddModalFor.images && openAddModalFor.images.length > 0 ? (
                <Image
                  className={styles.addModalImg}
                  src={getImageUrl(openAddModalFor.images[0].imageUrl) || ""}
                  alt={openAddModalFor.name}
                  width={120}
                  height={120}
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div className={styles.addModalImg} style={{ background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  No Image
                </div>
              )}
              <div className={styles.addModalInfo}>
                <div className={styles.addModalName}>{openAddModalFor.name}</div>
                <div className={styles.addModalDesc}>{openAddModalFor.description || "No description"}</div>
              </div>
              <div className={styles.basePrice}>
                <div className={styles.basePriceLabel}>Base Price</div>
                <div className={styles.basePriceVal}>₹{Number(openAddModalFor.basePrice).toFixed(2)}</div>
              </div>
            </div>

            <div className={styles.addModalSection}>
              <div className={styles.addModalSectionTitle}>Special Instructions (Optional)</div>
              <textarea
                className={styles.textInput}
                placeholder="Add any special instructions..."
                value={addModalNote}
                onChange={(e) => setAddModalNote(e.target.value)}
                rows={3}
              />
            </div>

            <div className={styles.addModalBottom}>
              <div className={styles.qtyPicker}>
                <button className={styles.qtyBtn2} onClick={() => setAddModalQty((q) => Math.max(1, q - 1))}>
                  <Minus size={18} />
                </button>
                <div className={styles.qtyVal2}>{addModalQty}</div>
                <button className={styles.qtyBtn2} onClick={() => setAddModalQty((q) => q + 1)}>
                  <Plus size={18} />
                </button>
              </div>

              <button className={styles.addConfirmBtn} onClick={confirmAddFromModal}>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
