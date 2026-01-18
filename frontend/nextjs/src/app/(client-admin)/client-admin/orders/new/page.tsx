"use client";

import React, { useMemo, useState } from "react";
import styles from "./NewOrder.module.css";
import Card from "@/components/ui/Card";
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
  ChevronRight,
  Boxes,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

type OrderType = "Dine In" | "Take Away";

type Category = {
  id: string;
  label: string;
  count: number;
};

type MenuItem = {
  id: string;
  name: string;
  desc: string;
  price: number;
  available: boolean;
  categoryId: string;
  imageUrl: string;
};

type AddOn = {
  id: string;
  label: string;
  price: number;
};

type CartLine = {
  id: string; // menuItemId
  menuItem: MenuItem;
  qty: number;
  addOns: AddOn[];
  note?: string;
};

const TAX_RATE = 0.12;

const CATEGORIES: Category[] = [
  { id: "all", label: "All", count: 64 },
  { id: "chef", label: "Chef Reccomendation", count: 8 },
  { id: "soup", label: "Soup", count: 11 },
  { id: "noodle", label: "Noodle", count: 7 },
  { id: "rice", label: "Rice", count: 15 },
  { id: "dessert", label: "Dessert", count: 12 },
  { id: "drinks", label: "Drinks", count: 12 },
];

const MENU_ITEMS: MenuItem[] = [
  {
    id: "butter-chicken",
    name: "Butter Chicken",
    desc: "Creamy butter chicken with spices, served with rice.",
    price: 12.64,
    available: true,
    categoryId: "chef",
    imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc500f?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "wagyu-steak",
    name: "Wagyu Steak",
    desc: "Savor our Wagyu Steak, rich in flavor and buttery texture.",
    price: 31.17,
    available: true,
    categoryId: "chef",
    imageUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "pasta-bolognese",
    name: "Pasta Bolognese",
    desc: "Delicious Pasta Bolognese made with fresh tomatoes, beef, and herbs.",
    price: 23.5,
    available: true,
    categoryId: "noodle",
    imageUrl: "https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "lemon-butter-dory",
    name: "Lemon Butter Dory",
    desc: "Zesty lemon butter sauce enhances the dory's rich flavor.",
    price: 50.5,
    available: true,
    categoryId: "chef",
    imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "spicy-tuna-nachos",
    name: "Spicy Tuna Nachos",
    desc: "Crispy nachos topped with spicy tuna, jalapeos, and avocado.",
    price: 45.99,
    available: false,
    categoryId: "chef",
    imageUrl: "https://images.unsplash.com/photo-1604908554162-49d0c035b2f6?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "banana-wrap",
    name: "Banana Wrap",
    desc: "Delicious banana wrapped in a soft tortilla with honey.",
    price: 25.0,
    available: true,
    categoryId: "dessert",
    imageUrl: "https://images.unsplash.com/photo-1604908554065-793e9c8b0f7d?auto=format&fit=crop&w=800&q=60",
  },
];

const BANANA_WRAP_ADDONS: AddOn[] = [
  { id: "honey", label: "Honey Jam", price: 17 },
  { id: "strawberry", label: "Strawberry Jam", price: 12 },
  { id: "vanilla", label: "Vanilla Jam", price: 8 },
  { id: "tiramisu", label: "Tiramisu Jam", price: 10 },
  { id: "mango", label: "Mango Jam", price: 11 },
];

export default function NewOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [orderType, setOrderType] = useState<OrderType>("Take Away");
  const [customerName, setCustomerName] = useState<string>("");

  const [categoryId, setCategoryId] = useState<string>("all");
  const [query, setQuery] = useState<string>("");

  const [cart, setCart] = useState<CartLine[]>([]);

  const [openAddModalFor, setOpenAddModalFor] = useState<MenuItem | null>(null);
  const [addModalQty, setAddModalQty] = useState<number>(1);
  const [selectedAddOnId, setSelectedAddOnId] = useState<string | null>("honey");

  const filteredMenu = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MENU_ITEMS.filter((m) => {
      const matchesCategory = categoryId === "all" ? true : m.categoryId === categoryId;
      const matchesQuery = !q || m.name.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [categoryId, query]);

  const subTotal = useMemo(() => {
    return cart.reduce((sum, line) => {
      const addOnTotal = line.addOns.reduce((a, b) => a + b.price, 0);
      return sum + (line.menuItem.price + addOnTotal) * line.qty;
    }, 0);
  }, [cart]);

  const tax = useMemo(() => subTotal * TAX_RATE, [subTotal]);
  const total = useMemo(() => subTotal + tax, [subTotal, tax]);

  const resetOrder = () => setCart([]);

  const addLine = (menuItem: MenuItem, qty: number, addOns: AddOn[]) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((p) => p.id === menuItem.id && p.addOns.map((a) => a.id).join(",") === addOns.map((a) => a.id).join(","));
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], qty: next[existingIdx].qty + qty };
        return next;
      }
      return [...prev, { id: menuItem.id, menuItem, qty, addOns }];
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

  const openAddModal = (menuItem: MenuItem) => {
    setOpenAddModalFor(menuItem);
    setAddModalQty(1);
    setSelectedAddOnId(menuItem.id === "banana-wrap" ? "honey" : null);
  };

  const confirmAddFromModal = () => {
    if (!openAddModalFor) return;
    const addOns =
      openAddModalFor.id === "banana-wrap" && selectedAddOnId
        ? BANANA_WRAP_ADDONS.filter((a) => a.id === selectedAddOnId)
        : [];
    addLine(openAddModalFor, addModalQty, addOns);
    setOpenAddModalFor(null);
  };

  const canContinueFromInfo = orderType.length > 0;

  return (
    <div className={styles.pageWrap}>
      <div className={styles.topHeader}>
        <button className={styles.backBtn} onClick={() => (step === 1 ? null : setStep(1))} aria-label="Back">
          <ArrowLeft size={18} />
        </button>

        <div className={styles.breadcrumbs}>
          <div className={styles.breadcrumbTitle}>{step === 1 ? "Select Order Type" : "Select Menu"}</div>
          <div className={styles.breadcrumbTrail}>
            <span className={cn(styles.crumb, styles.crumbActive)}>{step === 1 ? "Customer Information" : "Select Menu"}</span>
            <span className={styles.crumbSep}>&gt;</span>
            <span className={cn(styles.crumb, step === 2 ? styles.crumbActive : styles.crumbMuted)}>{step === 1 ? "Select Menu" : "Order Summary"}</span>
          </div>
        </div>

        <button className={styles.closeBtn} aria-label="Close">
          <X size={18} />
        </button>
      </div>

      {step === 1 && (
        <div className={styles.centerStage}>
          <div className={styles.orderInfoCard}>
            <div className={styles.formTitle}>Order Info</div>

            <div className={styles.fieldLabel}>Order Type</div>
            <div className={styles.typeGrid}>
              <button
                className={cn(styles.typeCard, orderType === "Dine In" && styles.typeCardActive)}
                onClick={() => setOrderType("Dine In")}
              >
                <span>Dine In</span>
              </button>
              <button
                className={cn(styles.typeCard, orderType === "Take Away" && styles.typeCardActive)}
                onClick={() => setOrderType("Take Away")}
              >
                <span>Take Away</span>
                <span className={styles.typeRadio} aria-hidden />
              </button>
            </div>

            <div className={styles.fieldLabel} style={{ marginTop: 16 }}>
              Customer Name
            </div>
            <input
              className={styles.textInput}
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            <div className={styles.formActions}>
              <button className={styles.primaryCta} disabled={!canContinueFromInfo} onClick={() => setStep(2)}>
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

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
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Item Name" />
              </div>
            </div>

            <div className={styles.chipsRow}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  className={cn(styles.chip, c.id === categoryId && styles.chipActive)}
                  onClick={() => setCategoryId(c.id)}
                >
                  <span>{c.label}</span>
                  <span className={styles.chipCount}>{c.count}</span>
                </button>
              ))}
            </div>

            <div className={styles.sectionLabel}>Chef Reccomendation</div>

            <div className={styles.menuGrid}>
              {filteredMenu.map((item) => (
                <div key={item.id} className={styles.menuCard}>
                  <div className={styles.menuImageWrap}>
                    <img src={item.imageUrl} alt={item.name} className={styles.menuImage} />
                    <div className={cn(styles.availability, item.available ? styles.availOk : styles.availNo)}>
                      <span className={styles.dot} />
                      {item.available ? "Available" : "Not Available"}
                    </div>
                    <div className={styles.expandIcon} aria-hidden>
                      <span>⛶</span>
                    </div>
                  </div>

                  <div className={styles.menuBody}>
                    <div className={styles.menuName}>{item.name}</div>
                    <div className={styles.menuDesc}>{item.desc}</div>

                    <div className={styles.menuFooter}>
                      <div className={styles.menuPrice}>${item.price.toFixed(2)}</div>
                      <button
                        className={styles.addToCartBtn}
                        disabled={!item.available}
                        onClick={() => openAddModal(item)}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                  <div className={styles.emptyTitle}>No order found</div>
                  <div className={styles.emptySub}>
                    Select menu from menu list on left side and <b>Add to Cart</b>.
                  </div>
                </div>
              ) : (
                <div className={styles.cartList}>
                  {cart.map((line, idx) => (
                    <div key={`${line.id}-${idx}`} className={styles.cartLine}>
                      <div className={styles.cartTopRow}>
                        <img className={styles.cartThumb} src={line.menuItem.imageUrl} alt={line.menuItem.name} />
                        <div className={styles.cartInfo}>
                          <div className={styles.cartName}>{line.menuItem.name}</div>
                          {line.addOns.length > 0 ? (
                            <div className={styles.cartSub}>
                              Addition: {line.addOns.map((a) => a.label).join(" , ")}
                            </div>
                          ) : null}
                          <div className={styles.cartNote}>Note: Don't use onion</div>
                        </div>
                        <button className={styles.trashBtn} onClick={() => removeLine(idx)} aria-label="Remove">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className={styles.cartBottomRow}>
                        <div className={styles.cartPrice}>${line.menuItem.price.toFixed(2)}</div>
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
                <span>US${subTotal.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Tax 12%</span>
                <span>US${tax.toFixed(2)}</span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={styles.summaryTotal}>
                <span>Total Payment</span>
                <span>US${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              className={styles.continueBtn}
              disabled={cart.length === 0}
              onClick={() => router.push("/payments")}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {openAddModalFor && (
        <div className={styles.modalOverlay} onMouseDown={() => setOpenAddModalFor(null)} role="dialog" aria-modal="true">
          <div className={styles.addModal} onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.addModalHeader}>
              <div className={styles.addModalTitle}>
                <span className={styles.cartGlyph}>🛒</span> Add Order
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setOpenAddModalFor(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className={styles.addModalTop}>
              <img className={styles.addModalImg} src={openAddModalFor.imageUrl} alt={openAddModalFor.name} />
              <div className={styles.addModalInfo}>
                <div className={styles.addModalName}>{openAddModalFor.name}</div>
                <div className={styles.addModalDesc}>Banana Wrap with Spicy Peanut Sauce</div>
              </div>
              <div className={styles.basePrice}>
                <div className={styles.basePriceLabel}>Base Price</div>
                <div className={styles.basePriceVal}>${openAddModalFor.price.toFixed(2)}</div>
              </div>
            </div>

            <div className={styles.addModalSection}>
              <div className={styles.addModalSectionTitle}>Add On</div>
              <div className={styles.addonList}>
                {BANANA_WRAP_ADDONS.map((a) => (
                  <label key={a.id} className={styles.addonRow}>
                    <input
                      type="radio"
                      name="addon"
                      checked={selectedAddOnId === a.id}
                      onChange={() => setSelectedAddOnId(a.id)}
                    />
                    <span className={styles.addonName}>{a.label}</span>
                    <span className={styles.addonPrice}>+${a.price.toFixed(2)}</span>
                  </label>
                ))}
              </div>
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

              <button className={styles.addConfirmBtn} onClick={confirmAddFromModal} disabled={!selectedAddOnId}>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
