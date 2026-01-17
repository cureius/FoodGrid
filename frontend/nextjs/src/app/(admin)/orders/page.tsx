"use client";

import React, { useMemo, useState } from "react";
import styles from "./Orders.module.css";
import Card from "@/components/ui/Card";
import { Clock, Plus, Search, ChevronDown, ArrowRight } from "lucide-react";
import Link from "next/link";

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

const ORDERS: Order[] = [
  {
    id: "DI104",
    type: "Dine In",
    time: "Mon, 17 Feb 12:24 PM",
    table: "B3",
    customer: "Eve",
    status: "In Progress",
    progress: 10,
    itemsCount: 10,
    total: 156.0,
    items: [
      { name: "Belgian Waffles", qty: 2, price: 32.0, checked: false },
      { name: "Classic Lemonade", qty: 3, price: 36.0, checked: false },
      { name: "Creamy Garlic Chicken", qty: 4, price: 60.0, checked: false },
      { name: "Spicy Tuna Tartare", qty: 1, price: 28.0, checked: false },
    ],
  },
  {
    id: "TA001",
    type: "Take Away",
    time: "Mon, 17 Feb 10:20 PM",
    table: "A7",
    customer: "Vlona",
    status: "In Progress",
    progress: 10,
    itemsCount: 10,
    total: 156.0,
    items: [
      { name: "Belgian Waffles", qty: 2, price: 32.0, checked: false },
      { name: "Classic Lemonade", qty: 3, price: 36.0, checked: false },
      { name: "Creamy Garlic Chicken", qty: 4, price: 60.0, checked: false },
      { name: "Spicy Tuna Tartare", qty: 1, price: 28.0, checked: false },
    ],
  },
  {
    id: "DI103",
    type: "Dine In",
    time: "Mon, 17 Feb 11:41 PM",
    table: "A10",
    customer: "Nielson",
    status: "In Progress",
    progress: 40,
    itemsCount: 10,
    total: 156.0,
    items: [
      { name: "Belgian Waffles", qty: 2, price: 32.0, checked: true },
      { name: "Classic Lemonade", qty: 3, price: 36.0, checked: false },
      { name: "Creamy Garlic Chicken", qty: 4, price: 60.0, checked: true },
      { name: "Spicy Tuna Tartare", qty: 1, price: 28.0, checked: false },
    ],
  },
];

export default function OrderPage() {
  const [activeStatus, setActiveStatus] = useState<OrderStatus>("All");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("Latest Order");

  const statusFilters: { label: OrderStatus; count: number }[] = [
    { label: "All", count: 20 },
    { label: "In Progress", count: 20 },
    { label: "Ready to Served", count: 20 },
    { label: "Waiting for Payment", count: 20 },
  ];

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ORDERS.filter((o) => {
      const matchesStatus = activeStatus === "All" ? true : o.status === activeStatus;
      const matchesQuery = !q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [activeStatus, query]);

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <div className={styles.pageTitle}>
          <div className={styles.pageIcon} aria-hidden>
            <Clock size={18} />
          </div>
          <h2>Order</h2>
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

          <Link href="/orders/new" className={styles.createBtn}>
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

      <div className={styles.grid}>
        {filteredOrders.map((order) => (
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
                    <span className={styles.itemPrice}>${it.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <span />
                <span className={styles.totalValue}>${order.total.toFixed(2)}</span>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <button className={styles.secondaryBtn}>See Details</button>
              <button className={styles.primaryBtn} disabled={order.status !== "Waiting for Payment"}>
                Pay Bills
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
