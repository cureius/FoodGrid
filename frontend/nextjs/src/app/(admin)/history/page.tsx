"use client";

import React, { useMemo, useState } from "react";
import styles from "./History.module.css";
import { cn } from "@/lib/utils";
import { History as HistoryIcon, Search, ReceiptText, Printer } from "lucide-react";

type HistoryFilter = "All Category" | "Dine In" | "Take Away";

type HistoryRow = {
  id: string;
  when: string;
  orderType: "Dine In" | "Take Away";
  table?: string;
  customer: string;
  total: number;
};

type BillLine = {
  name: string;
  price: number;
  qty: number;
};

type BillDetails = {
  id: string;
  orderType: "Dine In" | "Take Away";
  table?: string;
  customer: string;
  whenShort: string;
  whenTime: string;
  lines: BillLine[];
};

const ORDERS: HistoryRow[] = [
  { id: "DI104", when: "Mon, 17 Feb 12:24 AM", orderType: "Dine In", table: "B3", customer: "Eve", total: 241.55 },
  { id: "DI001", when: "Mon, 17 Feb 02:53 PM", orderType: "Dine In", table: "A2", customer: "Mythia", total: 185.0 },
  { id: "TA002", when: "Mon, 17 Feb 02:31 PM", orderType: "Take Away", customer: "Rachel", total: 495.0 },
  { id: "TA001", when: "Mon, 17 Feb 03:43 PM", orderType: "Take Away", customer: "Daniel", total: 274.0 },
  { id: "DE001", when: "Mon, 17 Feb 12:32 PM", orderType: "Dine In", table: "C1", customer: "Ava", total: 126.4 },
  { id: "TA003", when: "Mon, 17 Feb 05:12 PM", orderType: "Take Away", customer: "David", total: 88.0 },
  { id: "DI056", when: "Mon, 17 Feb 06:10 PM", orderType: "Dine In", table: "B1", customer: "Noah", total: 310.25 },
];

const BILLS: Record<string, BillDetails> = {
  DI104: {
    id: "DI104",
    orderType: "Dine In",
    table: "B3",
    customer: "Eve",
    whenShort: "Mon, 17 Feb",
    whenTime: "12:24 AM",
    lines: [
      { name: "Lemon Butter Dory", price: 50.5, qty: 2 },
      { name: "Fried Rice with Green Chili", price: 45.99, qty: 1 },
      { name: "Banana Wrap", price: 25.0, qty: 2 },
      { name: "Banana Wrap", price: 8.0, qty: 2 },
    ],
  },
};

const TAX_RATE = 0.12;

function money(v: number) {
  return `US$${v.toFixed(2)}`;
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<HistoryFilter>("All Category");
  const [query, setQuery] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>("DI104");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ORDERS.filter((o) => {
      const matchesFilter =
        filter === "All Category" ? true : filter === "Dine In" ? o.orderType === "Dine In" : o.orderType === "Take Away";
      const matchesQuery =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        (o.table ? o.table.toLowerCase().includes(q) : false);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  const selectedBill = selectedId ? BILLS[selectedId] : undefined;

  const selectedSubTotal = useMemo(() => {
    if (!selectedBill) return 0;
    return selectedBill.lines.reduce((s, l) => s + l.price * l.qty, 0);
  }, [selectedBill]);

  const selectedTax = useMemo(() => selectedSubTotal * TAX_RATE, [selectedSubTotal]);
  const selectedTotal = useMemo(() => selectedSubTotal + selectedTax, [selectedSubTotal, selectedTax]);

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <div className={styles.titlePill}>
          <HistoryIcon size={18} />
          <span>History</span>
        </div>

        <div className={styles.searchWrap}>
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Order ID or Customer Name"
          />
        </div>
      </div>

      <div className={styles.shell}>
        <div className={styles.left}>
          <div className={styles.filters}>
            {(["All Category", "Dine In", "Take Away"] as HistoryFilter[]).map((f) => (
              <button
                key={f}
                className={cn(styles.filterBtn, filter === f && styles.filterBtnActive)}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className={styles.list}>
            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                className={cn(styles.orderCard, selectedId === o.id && styles.orderCardSelected)}
                onClick={() => setSelectedId(o.id)}
              >
                <div className={styles.orderCardHeader}>
                  <div className={styles.orderId}>Order# <b>{o.id}</b></div>
                  <div className={styles.orderWhen}>{o.when}</div>
                </div>

                <div className={styles.orderCardBody}>
                  <div className={styles.kv}>
                    <div className={styles.kLabel}>Order Type</div>
                    <div className={styles.kValue}>{o.orderType}</div>
                  </div>

                  {o.orderType === "Dine In" ? (
                    <div className={styles.kv}>
                      <div className={styles.kLabel}>Table Number</div>
                      <div className={styles.kValue}>{o.table}</div>
                    </div>
                  ) : (
                    <div className={styles.kv}>
                      <div className={styles.kLabel}>Customer Name</div>
                      <div className={styles.kValue}>{o.customer}</div>
                    </div>
                  )}

                  <div className={styles.kv}>
                    <div className={styles.kLabel}>Customer Name</div>
                    <div className={styles.kValue}>{o.customer}</div>
                  </div>

                  <div className={styles.kv}>
                    <div className={styles.kLabel}>Total Sales</div>
                    <div className={styles.kValue}>$ {o.total.toFixed(2)}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.right}>
          {selectedBill ? (
            <div className={styles.billCard}>
              <div className={styles.billHeaderTitle}>Bill Information</div>

              <div className={styles.billHeader}>
                <div className={styles.tableBadge}>{selectedBill.table ?? "TA"}</div>
                <div className={styles.billHeaderMain}>
                  <div className={styles.billCustomer}>{selectedBill.customer}</div>
                  <div className={styles.billMeta}>
                    Order# <b>{selectedBill.id}</b> / <b>{selectedBill.orderType}</b>
                  </div>
                </div>
                <div className={styles.billWhen}>
                  {selectedBill.whenShort}
                  <br />
                  {selectedBill.whenTime}
                </div>
              </div>

              <div className={styles.billSectionTitle}>Order Details</div>

              <div className={styles.billLines}>
                {selectedBill.lines.map((l, idx) => (
                  <div key={idx} className={styles.billLine}>
                    <div className={styles.billLineLeft}>
                      <div className={styles.billLineName}>{l.name}</div>
                      <div className={styles.billLineUnit}>{money(l.price)}</div>
                    </div>
                    <div className={styles.billLineRight}>
                      <div className={styles.billLineQty}>x {l.qty}</div>
                      <div className={styles.billLineTotal}>{money(l.price * l.qty)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.billTotalsWrap}>
                <div className={styles.billTotalRow}>
                  <span>Sub Total</span>
                  <span>{money(selectedSubTotal)}</span>
                </div>
                <div className={styles.billTotalRow}>
                  <span>Tax 12%</span>
                  <span>{money(selectedTax)}</span>
                </div>
                <div className={styles.billDivider} />
                <div className={styles.billTotalPayment}>
                  <span>Total Payment</span>
                  <span>{money(selectedTotal)}</span>
                </div>
              </div>

              <button className={styles.printBtn} type="button">
                <Printer size={18} /> Print Invoice
              </button>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <ReceiptText size={22} />
              </div>
              <div className={styles.emptyTitle}>Select Bill</div>
              <div className={styles.emptySub}>
                Select order history on left side to see the <b>Bill Details</b>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
