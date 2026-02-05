"use client";

import { Grid3X3, Zap } from "lucide-react";
import Logo from "@/components/Logo";
import styles from "../pitch.module.css";

export default function OpeningSlide() {
  return (
    <div className={styles.ctaSection}>
      <div className={styles.slideLabel}>
        <Grid3X3 size={16} />
        Restaurant Operations Platform
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <Logo size={64} />
      </div>

      <h1 className={styles.slideTitle}>
        Unified Restaurant Operations<br />
        & <span>Ordering Platform</span>
      </h1>

      <p className={styles.slideSubtitle} style={{ textAlign: "center", maxWidth: "700px" }}>
        Own your operations. Own your data. Stop juggling fragmented tools and aggregator dependencies.
        One platform for POS, kitchen, orders, and multi-outlet management.
      </p>

      <div className={styles.statsGrid} style={{ marginTop: "3rem", maxWidth: "800px" }}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>1</div>
          <div className={styles.statLabel}>Unified Platform</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: "var(--success)" }}>
            <Zap size={40} style={{ display: "inline" }} />
          </div>
          <div className={styles.statLabel}>Real-time Operations</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>100%</div>
          <div className={styles.statLabel}>Data Ownership</div>
        </div>
      </div>
    </div>
  );
}
