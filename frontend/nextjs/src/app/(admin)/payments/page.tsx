"use client";

import React, { useMemo, useState } from "react";
import styles from "./Payments.module.css";
import {
  ArrowLeft,
  X,
  Wallet,
  CreditCard,
  QrCode,
  Search,
  Delete,
  Printer,
  Check,
} from "lucide-react";

type PaymentMethod = "Cash" | "Card" | "QR Code";

type OrderLine = {
  name: string;
  price: number;
  qty: number;
};

const ORDER = {
  customerName: "Zahir Mays",
  orderId: "TA104",
  orderType: "Take Away" as const,
  time: "Mon, 17 Feb\n12:24 PM",
  lines: [
    { name: "Lemon Butter Dory", price: 50.5, qty: 2 },
    { name: "Fried Rice with Green Chili", price: 45.99, qty: 1 },
    { name: "Banana Wrap", price: 25.0, qty: 2 },
    { name: "Banana Wrap", price: 8.0, qty: 2 },
  ] satisfies OrderLine[],
};

const TAX_RATE = 0.12;

function formatMoney(v: number) {
  return `US$${v.toFixed(2)}`;
}

export default function PaymentsPage() {
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [memberCode, setMemberCode] = useState<string>("");
  const [cashInput, setCashInput] = useState<string>("0");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const subTotal = useMemo(
    () => ORDER.lines.reduce((s, l) => s + l.price * l.qty, 0),
    []
  );
  const tax = useMemo(() => subTotal * TAX_RATE, [subTotal]);
  const total = useMemo(() => subTotal + tax, [subTotal, tax]);

  const customerPays = useMemo(() => {
    const n = Number(cashInput || "0");
    return Number.isFinite(n) ? n : 0;
  }, [cashInput]);

  const change = useMemo(() => Math.max(0, customerPays - total), [customerPays, total]);

  const canPayNow = method !== "Cash" ? true : customerPays >= total;

  const addDigit = (d: string) => {
    setCashInput((prev) => {
      const p = prev === "0" ? "" : prev;
      const next = `${p}${d}`;
      return next.length === 0 ? "0" : next;
    });
  };

  const backspace = () => {
    setCashInput((prev) => {
      const next = prev.length <= 1 ? "0" : prev.slice(0, -1);
      return next;
    });
  };

  const preset = (amt: number) => {
    setCashInput(String(amt));
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <button className={styles.iconBtn} aria-label="Back">
            <ArrowLeft size={18} />
          </button>

          <div className={styles.headerTitleWrap}>
            <div className={styles.headerTitle}>Payment</div>
            <span className={styles.headerPill}>int</span>
          </div>

          <button className={styles.iconBtn} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.bodyCard}>
          <div className={styles.bodyHeader}>
            <div className={styles.bodyHeaderLeft}>
              <Wallet size={18} />
              <span>Payment</span>
            </div>
          </div>

          {!isSuccess ? (
            <div className={styles.split}>
              {/* Left */}
              <div className={styles.left}>
                <div className={styles.leftTop}>
                  <div>
                    <div className={styles.mutedLabel}>Customer Information</div>
                    <div className={styles.customerName}>{ORDER.customerName}</div>
                    <div className={styles.customerSub}>
                      Order# <b>{ORDER.orderId}</b> / <b>{ORDER.orderType}</b>
                    </div>
                  </div>
                  <div className={styles.orderTime}>{ORDER.time}</div>
                </div>

                <div className={styles.memberRow}>
                  <input
                    className={styles.memberInput}
                    placeholder="Input Member Code"
                    value={memberCode}
                    onChange={(e) => setMemberCode(e.target.value)}
                  />
                  <button className={styles.searchBtn}>
                    <Search size={18} />
                    Search
                  </button>
                </div>

                <div className={styles.sectionTitle}>Order Details</div>

                <div className={styles.orderList}>
                  {ORDER.lines.map((l, idx) => (
                    <div key={idx} className={styles.orderLine}>
                      <div className={styles.orderLineLeft}>
                        <div className={styles.orderLineName}>{l.name}</div>
                        <div className={styles.orderLinePrice}>{formatMoney(l.price)}</div>
                      </div>
                      <div className={styles.orderLineRight}>
                        <div className={styles.qtyText}>x {l.qty}</div>
                        <div className={styles.lineTotal}>{formatMoney(l.price * l.qty)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.totals}>
                  <div className={styles.totalRow}>
                    <span>Sub Total</span>
                    <span>{formatMoney(subTotal)}</span>
                  </div>
                  <div className={styles.totalRow}>
                    <span>Tax 12%</span>
                    <span>{formatMoney(tax)}</span>
                  </div>
                  <div className={styles.totalRowStrong}>
                    <span>Total Payment</span>
                    <span>{formatMoney(total)}</span>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className={styles.right}>
                <div className={styles.methodTabs}>
                  <button
                    className={method === "Cash" ? styles.methodActive : styles.methodTab}
                    onClick={() => setMethod("Cash")}
                  >
                    <Wallet size={16} /> Cash
                  </button>
                  <button
                    className={method === "Card" ? styles.methodActive : styles.methodTab}
                    onClick={() => setMethod("Card")}
                    disabled
                  >
                    <CreditCard size={16} /> Card
                  </button>
                  <button
                    className={method === "QR Code" ? styles.methodActive : styles.methodTab}
                    onClick={() => setMethod("QR Code")}
                    disabled
                  >
                    <QrCode size={16} /> QR Code
                  </button>
                </div>

                <div className={styles.inputTitle}>Input Money</div>
                <div className={styles.inputHint}>Input the cash amount received from the customer.</div>

                <div className={styles.moneyDisplay}>
                  <span className={styles.moneySymbol}>$</span>
                  <span className={styles.moneyValue}>{cashInput}</span>
                </div>

                <div className={styles.presets}>
                  {[20, 50, 100, 200].map((p) => (
                    <button key={p} className={styles.presetBtn} onClick={() => preset(p)}>
                      ${p}
                    </button>
                  ))}
                </div>

                <div className={styles.keypad}>
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                    <button key={d} className={styles.keyBtn} onClick={() => addDigit(d)}>
                      {d}
                    </button>
                  ))}
                  <div />
                  <button className={styles.keyBtn} onClick={() => addDigit("0")}>
                    0
                  </button>
                  <button className={styles.keyBtnIcon} onClick={backspace} aria-label="Delete">
                    <Delete size={18} />
                  </button>
                </div>

                <button className={styles.payNowBtn} disabled={!canPayNow} onClick={() => setIsSuccess(true)}>
                  Pay Now
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.successWrap}>
              <div className={styles.successCard}>
                <div className={styles.successIcon}>
                  <Check size={34} />
                </div>
                <div className={styles.successTitle}>Payment Successful!</div>
                <div className={styles.successSub}>Don't forget to say Thank You to customers</div>

                <div className={styles.detailBox}>
                  <div className={styles.detailHeader}>Detail Payment</div>
                  <div className={styles.detailRow}>
                    <span>Total Payment</span>
                    <b>{formatMoney(total)}</b>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Payment Method</span>
                    <b className={styles.methodValue}>
                      <Wallet size={14} /> Cash
                    </b>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Customer Pays</span>
                    <b>{formatMoney(customerPays)}</b>
                  </div>
                  <div className={styles.detailDivider} />
                  <div className={styles.changeRow}>
                    <span>Change</span>
                    <b>{formatMoney(change)}</b>
                  </div>
                </div>
              </div>

              <div className={styles.successButtons}>
                <button className={styles.printBtn}>
                  <Printer size={18} /> Print Bill
                </button>
                <button className={styles.confirmBtn}>Confirm Payment</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
