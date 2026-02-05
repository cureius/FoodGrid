"use client";

import { Package, Monitor, ChefHat, QrCode, Users, LayoutDashboard } from "lucide-react";
import styles from "../pitch.module.css";

const modules = [
  {
    icon: Monitor,
    title: "POS & Billing",
    features: [
      "Quick order entry",
      "Multiple payment modes",
      "Bill splitting & discounts",
      "Receipt printing",
      "Offline mode support",
    ],
  },
  {
    icon: ChefHat,
    title: "KOT & Kitchen Flow",
    features: [
      "Real-time order display",
      "Station-wise routing",
      "Priority management",
      "Prep time tracking",
      "Kitchen load balancing",
    ],
  },
  {
    icon: QrCode,
    title: "Customer QR Ordering",
    features: [
      "Table QR scan",
      "Browse menu & customize",
      "Direct order placement",
      "Real-time status updates",
      "No app download needed",
    ],
  },
  {
    icon: Users,
    title: "Staff Application",
    features: [
      "Role-based dashboards",
      "Order status updates",
      "Table management",
      "Attendance & shifts",
      "Performance metrics",
    ],
  },
  {
    icon: LayoutDashboard,
    title: "Admin Dashboard",
    features: [
      "Sales & revenue overview",
      "Menu management",
      "Staff management",
      "Outlet configuration",
      "Real-time analytics",
    ],
  },
];

export default function ProductModulesSlide() {
  return (
    <div>
      <div className={styles.slideLabel}>
        <Package size={16} />
        Product Modules
      </div>

      <h2 className={styles.slideTitle}>
        Everything You Need, <span>Built In</span>
      </h2>

      <p className={styles.slideSubtitle}>
        Five integrated modules working together seamlessly. No integrations to maintain,
        no data silos, no sync issues.
      </p>

      <div className={styles.moduleGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {modules.map((module, index) => (
          <div key={index} className={styles.moduleCard}>
            <div className={styles.moduleHeader}>
              <div className={styles.moduleIcon}>
                <module.icon size={20} />
              </div>
              <span className={styles.moduleTitle}>{module.title}</span>
            </div>
            <div className={styles.moduleFeatures}>
              {module.features.map((feature, fIndex) => (
                <span key={fIndex} className={styles.moduleFeature}>
                  {feature}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
