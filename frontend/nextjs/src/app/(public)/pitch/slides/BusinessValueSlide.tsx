"use client";

import { TrendingUp, PiggyBank, Timer, BarChart3, Shield, Zap } from "lucide-react";
import styles from "../pitch.module.css";

const valuePoints = [
  {
    icon: PiggyBank,
    title: "Cost Savings",
    description: "Reduce aggregator dependency. Every direct order saves 25-30% commission. One system means fewer subscriptions.",
    metric: "25-30%",
    metricLabel: "Commission saved on direct orders",
    variant: "cardIconSuccess",
  },
  {
    icon: Zap,
    title: "Faster Operations",
    description: "Digital order flow eliminates manual steps. Kitchen gets orders instantly. Staff updates in one tap.",
    metric: "50%",
    metricLabel: "Faster order processing",
    variant: "cardIconWarning",
  },
  {
    icon: BarChart3,
    title: "Complete Visibility",
    description: "Real-time dashboards at outlet and brand level. Know what's selling, what's slow, where staff excels.",
    metric: "Real-time",
    metricLabel: "Operational visibility",
    variant: "cardIconInfo",
  },
  {
    icon: Shield,
    title: "Data Ownership",
    description: "Customer data stays with you. Build loyalty programs. Run your own marketing. Own the relationship.",
    metric: "100%",
    metricLabel: "Customer data retained",
    variant: "cardIconSuccess",
  },
];

export default function BusinessValueSlide() {
  return (
    <div>
      <div className={styles.slideLabel}>
        <TrendingUp size={16} />
        Business Value
      </div>

      <h2 className={styles.slideTitle}>
        The <span>Impact</span> on Your Business
      </h2>

      <p className={styles.slideSubtitle}>
        Beyond features, FoodGrid delivers measurable business outcomes —
        cost reduction, operational efficiency, and strategic control.
      </p>

      <div className={styles.cardsGrid2}>
        {valuePoints.map((point, index) => (
          <div key={index} className={styles.card} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div className={`${styles.cardIcon} ${styles[point.variant]}`}>
                <point.icon size={28} />
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary)" }}>
                  {point.metric}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                  {point.metricLabel}
                </div>
              </div>
            </div>
            <div>
              <h3 className={styles.cardTitle}>{point.title}</h3>
              <p className={styles.cardDescription}>{point.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.highlightBox} style={{ marginTop: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", justifyContent: "center" }}>
          <Timer size={24} color="var(--primary)" />
          <span style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)" }}>
            Quick wins from day one — full ROI within months, not years
          </span>
        </div>
      </div>
    </div>
  );
}
