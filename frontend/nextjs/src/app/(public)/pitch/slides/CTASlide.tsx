"use client";

import { Rocket, Calendar, Mail, Phone, CheckCircle2 } from "lucide-react";
import Logo from "@/components/Logo";
import styles from "../pitch.module.css";

const nextSteps = [
  "15-minute discovery call",
  "Live product demo with your menu",
  "Custom pilot proposal",
  "Go live in under a week",
];

export default function CTASlide() {
  return (
    <div className={styles.ctaSection}>
      <div style={{ marginBottom: "1rem" }}>
        <Logo size={56} />
      </div>

      <h2 className={styles.slideTitle} style={{ textAlign: "center" }}>
        Ready to <span>Transform</span> Your Operations?
      </h2>

      <p className={styles.slideSubtitle} style={{ textAlign: "center", maxWidth: "600px" }}>
        Join restaurants that have unified their operations with FoodGrid.
        Start with one outlet, scale to many — all on one platform.
      </p>

      <div className={styles.ctaButtons} style={{ marginTop: "2rem" }}>
        <button className={styles.btnPrimary}>
          <Calendar size={20} />
          Book a Demo
        </button>
        <button className={styles.btnSecondary}>
          <Mail size={20} />
          Request Onboarding
        </button>
      </div>

      <div className={styles.highlightBox} style={{ marginTop: "3rem", maxWidth: "500px" }}>
        <h3 style={{
          fontSize: "1rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "1rem",
          textAlign: "center"
        }}>
          What Happens Next
        </h3>
        <ul style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem"
        }}>
          {nextSteps.map((step, index) => (
            <li key={index} style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "0.875rem",
              color: "var(--text-secondary)"
            }}>
              <span style={{
                width: "24px",
                height: "24px",
                background: "var(--success-light)",
                color: "var(--success)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <CheckCircle2 size={14} />
              </span>
              {step}
            </li>
          ))}
        </ul>
      </div>

      <div style={{
        marginTop: "2.5rem",
        display: "flex",
        gap: "2rem",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)" }}>
          <Mail size={18} />
          <span>hello@foodgrid.io</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)" }}>
          <Phone size={18} />
          <span>+91 98765 43210</span>
        </div>
      </div>
    </div>
  );
}
