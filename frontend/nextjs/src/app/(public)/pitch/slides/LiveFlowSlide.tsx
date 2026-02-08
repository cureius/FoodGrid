"use client";

import { Play, QrCode, ShoppingCart, ChefHat, CheckCircle, BarChart3, ArrowRight } from "lucide-react";
import styles from "../pitch.module.css";

const flowSteps = [
  {
    icon: QrCode,
    label: "Customer Scans QR",
    description: "At the table",
  },
  {
    icon: ShoppingCart,
    label: "Places Order",
    description: "Via mobile browser",
  },
  {
    icon: ChefHat,
    label: "KOT Prints",
    description: "Kitchen receives",
  },
  {
    icon: CheckCircle,
    label: "Staff Updates",
    description: "Order progress",
  },
  {
    icon: BarChart3,
    label: "Admin Sees",
    description: "Real-time reports",
  },
];

export default function LiveFlowSlide() {
  return (
    <div>
      <div className={styles.slideLabel}>
        <Play size={16} />
        Live Product Flow
      </div>

      <h2 className={styles.slideTitle}>
        From Scan to <span>Analytics</span> in Real-Time
      </h2>

      <p className={styles.slideSubtitle}>
        See how an order flows through the entire system — from the moment a customer
        scans your QR code to when it shows up in your admin dashboard.
      </p>

      <div className={styles.flowDiagram}>
        {flowSteps.map((step, index) => (
          <div key={index} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className={styles.flowStep}>
              <div className={styles.flowStepIcon}>
                <step.icon size={24} />
              </div>
              <div>
                <span className={styles.flowStepLabel}>{step.label}</span>
                <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.25rem" }}>
                  {step.description}
                </div>
              </div>
            </div>
            {index < flowSteps.length - 1 && (
              <div className={styles.flowArrow}>
                <ArrowRight size={24} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.highlightBox} style={{ marginTop: "3rem", textAlign: "center" }}>
        <h3 style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "1rem"
        }}>
          Everything Happens Automatically
        </h3>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "600px", margin: "0 auto" }}>
          No manual entry. No copy-paste between systems. No phone calls to the kitchen.
          The entire flow is digital, tracked, and instantly visible to everyone who needs it.
        </p>
      </div>
    </div>
  );
}
