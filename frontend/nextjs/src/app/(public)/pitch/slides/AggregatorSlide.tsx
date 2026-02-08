"use client";

import { Link2, ArrowRight, Monitor, ChefHat, Smartphone } from "lucide-react";
import styles from "../pitch.module.css";

export default function AggregatorSlide() {
  return (
    <div>
      <div className={styles.slideLabel}>
        <Link2 size={16} />
        Aggregator Integration
      </div>

      <h2 className={styles.slideTitle}>
        Zomato & Swiggy as <span>Channels</span>, Not Masters
      </h2>

      <p className={styles.slideSubtitle}>
        Aggregators become inbound order channels that feed into your unified POS and KOT system —
        not separate workflows requiring different hardware and staff.
      </p>

      <div className={styles.twoColumn} style={{ marginTop: "3rem" }}>
        <div className={styles.featureCardLarge}>
          <div className={styles.featureCardHeader}>
            <div className={styles.featureCardIcon}>
              <Smartphone size={28} />
            </div>
            <span className={styles.featureCardTitle}>Inbound Order Sources</span>
          </div>
          <div className={styles.featureCardContent}>
            <div className={styles.featureItem}>
              <div className={styles.featureItemIcon}>
                <ArrowRight size={16} />
              </div>
              <span className={styles.featureItemText}>
                <strong>Zomato Orders</strong> — Flow directly into your FoodGrid queue
              </span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureItemIcon}>
                <ArrowRight size={16} />
              </div>
              <span className={styles.featureItemText}>
                <strong>Swiggy Orders</strong> — Same kitchen, same KOT, same reports
              </span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureItemIcon}>
                <ArrowRight size={16} />
              </div>
              <span className={styles.featureItemText}>
                <strong>Direct Orders</strong> — Your QR code, zero commission
              </span>
            </div>
          </div>
        </div>

        <div className={styles.featureCardLarge}>
          <div className={styles.featureCardHeader}>
            <div className={styles.featureCardIcon} style={{ background: "var(--success-light)", color: "var(--success)" }}>
              <Monitor size={28} />
            </div>
            <span className={styles.featureCardTitle}>Unified Operations</span>
          </div>
          <div className={styles.featureCardContent}>
            <div className={styles.featureItem}>
              <div className={styles.featureItemIcon}>
                <ChefHat size={16} />
              </div>
              <span className={styles.featureItemText}>
                One KOT system for all order sources — kitchen sees unified queue
              </span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureItemIcon}>
                <Monitor size={16} />
              </div>
              <span className={styles.featureItemText}>
                One POS, one inventory deduction, one revenue report
              </span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureItemIcon}>
                <Link2 size={16} />
              </div>
              <span className={styles.featureItemText}>
                Compare channel performance — direct vs aggregator revenue
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: "2.5rem",
        padding: "1.5rem 2rem",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--radius-lg)",
        textAlign: "center"
      }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
          <strong style={{ color: "var(--text-primary)" }}>Vision:</strong> Use aggregators for discovery and reach,
          but route customers to direct ordering over time — reducing commission costs while maintaining unified operations.
        </p>
      </div>
    </div>
  );
}
