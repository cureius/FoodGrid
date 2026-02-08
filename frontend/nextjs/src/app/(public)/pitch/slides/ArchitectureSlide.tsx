"use client";

import { Server, ArrowDown, Building2, Users, ShieldCheck } from "lucide-react";
import styles from "../pitch.module.css";

export default function ArchitectureSlide() {
  return (
    <div>
      <div className={styles.slideLabel}>
        <Server size={16} />
        Architecture
      </div>

      <h2 className={styles.slideTitle}>
        Multi-Tenant, <span>Multi-Outlet</span> by Design
      </h2>

      <p className={styles.slideSubtitle}>
        Built from day one to support restaurant chains, franchises, and growing brands.
        Central control with outlet-level flexibility.
      </p>

      <div className={styles.archDiagram}>
        {/* Tenant Layer */}
        <div className={styles.archLayer}>
          <span className={styles.archLayerLabel}>Brand / Tenant Level</span>
          <div className={styles.archLayerContent}>
            <div className={`${styles.archBox} ${styles.archBoxPrimary}`}>
              <Building2 size={20} style={{ marginBottom: 4 }} />
              <div>Tenant Admin</div>
            </div>
          </div>
        </div>

        <div className={styles.archConnector}>
          <ArrowDown size={24} color="var(--text-tertiary)" />
        </div>

        {/* Outlet Layer */}
        <div className={styles.archLayer}>
          <span className={styles.archLayerLabel}>Outlet Level</span>
          <div className={styles.archLayerContent}>
            <div className={`${styles.archBox} ${styles.archBoxSecondary}`}>Outlet A</div>
            <div className={`${styles.archBox} ${styles.archBoxSecondary}`}>Outlet B</div>
            <div className={`${styles.archBox} ${styles.archBoxSecondary}`}>Outlet C</div>
            <div className={`${styles.archBox} ${styles.archBoxOutline}`}>+ New Outlet</div>
          </div>
        </div>

        <div className={styles.archConnector}>
          <ArrowDown size={24} color="var(--text-tertiary)" />
        </div>

        {/* Role Layer */}
        <div className={styles.archLayer}>
          <span className={styles.archLayerLabel}>Role-Based Access</span>
          <div className={styles.archLayerContent}>
            <div className={`${styles.archBox} ${styles.archBoxSuccess}`}>
              <ShieldCheck size={16} style={{ marginRight: 4, display: "inline" }} />
              Admin
            </div>
            <div className={`${styles.archBox} ${styles.archBoxInfo}`}>
              <Users size={16} style={{ marginRight: 4, display: "inline" }} />
              Manager
            </div>
            <div className={`${styles.archBox} ${styles.archBoxInfo}`}>Staff</div>
            <div className={`${styles.archBox} ${styles.archBoxOutline}`}>Customer</div>
          </div>
        </div>
      </div>

      <div className={styles.cardsGrid} style={{ marginTop: "3rem" }}>
        <div className={styles.card}>
          <div className={`${styles.cardIcon} ${styles.cardIconSuccess}`}>
            <Building2 size={24} />
          </div>
          <h3 className={styles.cardTitle}>Centralized Control</h3>
          <p className={styles.cardDescription}>
            Manage menus, pricing, staff, and settings from one dashboard. Push changes to all outlets instantly.
          </p>
        </div>
        <div className={styles.card}>
          <div className={`${styles.cardIcon} ${styles.cardIconInfo}`}>
            <Users size={24} />
          </div>
          <h3 className={styles.cardTitle}>Role-Based Apps</h3>
          <p className={styles.cardDescription}>
            Each role sees exactly what they need. Admins get full control, staff see operations, customers see menus.
          </p>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon}>
            <Server size={24} />
          </div>
          <h3 className={styles.cardTitle}>Unified Reporting</h3>
          <p className={styles.cardDescription}>
            Brand-level and outlet-level reports. Compare performance, track trends, identify issues.
          </p>
        </div>
      </div>
    </div>
  );
}
