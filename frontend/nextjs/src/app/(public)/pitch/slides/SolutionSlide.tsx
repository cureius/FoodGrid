"use client";

import { CheckCircle2, Layers, Monitor, ChefHat, QrCode, Users, LayoutDashboard, Building2 } from "lucide-react";
import styles from "../pitch.module.css";

const solutions = [
  { icon: Monitor, label: "POS & Billing" },
  { icon: ChefHat, label: "KOT & Kitchen" },
  { icon: QrCode, label: "QR Ordering" },
  { icon: Users, label: "Staff Operations" },
  { icon: LayoutDashboard, label: "Admin Dashboard" },
  { icon: Building2, label: "Multi-Outlet" },
];

const benefits = [
  "Single login, all operations",
  "Real-time sync across outlets",
  "Role-based access control",
  "Centralized menu & pricing",
  "Unified reporting & analytics",
  "Your data, your customers",
];

export default function SolutionSlide() {
  return (
    <div>
      <div className={styles.slideLabel}>
        <Layers size={16} />
        The Solution
      </div>

      <h2 className={styles.slideTitle}>
        FoodGrid: <span>One Platform</span> for Everything
      </h2>

      <p className={styles.slideSubtitle}>
        Replace fragmented tools with a unified system that handles your entire restaurant operation —
        from customer order to kitchen to billing to analytics.
      </p>

      <div className={styles.twoColumn} style={{ marginTop: "3rem" }}>
        <div>
          <div className={styles.moduleGrid} style={{ marginTop: 0 }}>
            {solutions.map((item, index) => (
              <div key={index} className={styles.moduleCard} style={{ padding: "1.25rem" }}>
                <div className={styles.moduleHeader}>
                  <div className={styles.moduleIcon}>
                    <item.icon size={20} />
                  </div>
                  <span className={styles.moduleTitle}>{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.highlightBox}>
          <h3 style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "1.5rem"
          }}>
            What You Get
          </h3>
          <ul className={styles.checkList}>
            {benefits.map((benefit, index) => (
              <li key={index}>
                <span className={styles.checkIcon}>
                  <CheckCircle2 size={14} />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
