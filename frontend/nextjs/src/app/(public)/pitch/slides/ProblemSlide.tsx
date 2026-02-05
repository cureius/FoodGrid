"use client";

import { AlertTriangle, Puzzle, Eye, TrendingDown, Users, Banknote } from "lucide-react";
import styles from "../pitch.module.css";

const problems = [
  {
    icon: Puzzle,
    title: "Fragmented Tools",
    description: "Separate systems for POS, kitchen display, inventory, and reporting that don't talk to each other.",
    variant: "cardIconWarning",
  },
  {
    icon: Banknote,
    title: "Aggregator Dependency",
    description: "25-30% commission to Zomato/Swiggy. No direct customer relationship. Algorithm decides your visibility.",
    variant: "cardIconDanger",
  },
  {
    icon: Eye,
    title: "Zero Visibility",
    description: "No real-time view of what's happening across outlets. Reports are delayed, incomplete, or manual.",
    variant: "cardIconWarning",
  },
  {
    icon: Users,
    title: "Staff Chaos",
    description: "Staff juggling multiple devices and apps. Training overhead. Errors in order flow.",
    variant: "cardIconDanger",
  },
  {
    icon: TrendingDown,
    title: "No Data Ownership",
    description: "Customer data sits with aggregators. Can't build loyalty. Can't market directly.",
    variant: "cardIconWarning",
  },
  {
    icon: AlertTriangle,
    title: "Scaling Nightmares",
    description: "Opening a new outlet means setting up everything from scratch. No central control.",
    variant: "cardIconDanger",
  },
];

export default function ProblemSlide() {
  return (
    <div>
      <div className={styles.slideLabel}>
        <AlertTriangle size={16} />
        The Problem
      </div>

      <h2 className={styles.slideTitle}>
        Restaurant Operations Are <span>Broken</span>
      </h2>

      <p className={styles.slideSubtitle}>
        Restaurant owners face operational chaos daily. Multiple disconnected tools,
        heavy aggregator fees, and zero visibility into their own business.
      </p>

      <div className={styles.cardsGrid}>
        {problems.map((problem, index) => (
          <div key={index} className={styles.card}>
            <div className={`${styles.cardIcon} ${styles[problem.variant]}`}>
              <problem.icon size={28} />
            </div>
            <h3 className={styles.cardTitle}>{problem.title}</h3>
            <p className={styles.cardDescription}>{problem.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
