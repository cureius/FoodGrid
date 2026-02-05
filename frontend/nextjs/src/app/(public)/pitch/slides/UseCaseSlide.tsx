"use client";

import { Store, ArrowRight, Building2, TrendingUp, CheckCircle2 } from "lucide-react";
import styles from "../pitch.module.css";

const growthSteps = [
  {
    number: 1,
    title: "Single Outlet Launch",
    description: "Set up POS, KOT, QR ordering, and staff apps. Go live in days, not weeks.",
  },
  {
    number: 2,
    title: "Stabilize Operations",
    description: "Train staff on one system. Establish workflows. Build customer habits on direct ordering.",
  },
  {
    number: 3,
    title: "Second Outlet",
    description: "Clone configuration. Same menu, same pricing, same workflows. Central dashboard adds new outlet instantly.",
  },
  {
    number: 4,
    title: "Scale to Chain",
    description: "Add outlets without changing tools. Compare performance across locations. Unified brand management.",
  },
];

export default function UseCaseSlide() {
  return (
    <div>
      <div className={styles.slideLabel}>
        <Store size={16} />
        Use Case
      </div>

      <h2 className={styles.slideTitle}>
        From Single Café to <span>Multi-Outlet Chain</span>
      </h2>

      <p className={styles.slideSubtitle}>
        FoodGrid grows with you. Start with one outlet and scale without switching tools,
        retraining staff, or losing operational data.
      </p>

      <div className={styles.twoColumn} style={{ marginTop: "3rem", alignItems: "flex-start" }}>
        <div className={styles.useCaseCard}>
          <div className={styles.useCaseHeader}>
            <div className={styles.useCaseHeaderTitle}>Growth Journey</div>
            <div className={styles.useCaseHeaderSubtitle}>Same platform, every stage</div>
          </div>
          <div className={styles.useCaseBody}>
            <div className={styles.useCaseSteps}>
              {growthSteps.map((step) => (
                <div key={step.number} className={styles.useCaseStep}>
                  <div className={styles.useCaseStepNumber}>{step.number}</div>
                  <div className={styles.useCaseStepContent}>
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.cardIconSecondary}`}>
              <Store size={24} />
            </div>
            <h3 className={styles.cardTitle}>Perfect for Cafés</h3>
            <p className={styles.cardDescription}>
              Co-working cafés, standalone coffee shops, quick-service restaurants —
              anywhere with table service and takeaway.
            </p>
          </div>

          <div className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.cardIconInfo}`}>
              <Building2 size={24} />
            </div>
            <h3 className={styles.cardTitle}>Built for Chains</h3>
            <p className={styles.cardDescription}>
              Multi-location brands get central control, outlet comparison,
              and unified customer data from day one.
            </p>
          </div>

          <div className={styles.highlightBox}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <CheckCircle2 size={20} color="var(--success)" />
              <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>No Platform Migration</span>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Your second outlet uses the same FoodGrid instance as your first.
              No data export, no retraining, no transition period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
