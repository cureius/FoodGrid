"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Login.module.css";
import PinBoxes from "@/components/auth/PinBoxes";
import NumericKeypad from "@/components/auth/NumericKeypad";
import { Utensils, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const EMPLOYEES = [
  { id: "1", name: "Richard Wilson", role: "Waiter", initial: "RW" },
  { id: "2", name: "Orlando", role: "Waiter", initial: "OR" },
  { id: "3", name: "Eve", role: "Chef", initial: "EV" },
];

const PIN_LEN = 6;

export default function EmployeeLoginClient() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const onDigit = (d: string) => {
    if (pin.length < PIN_LEN) setPin(p => p + d);
  };

  const onBackspace = () => {
    setPin(p => p.slice(0, -1));
  };

  const handleLogin = () => {
    setLoading(true);
    // Simulate login
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  const canSubmit = selectedId && pin.length === PIN_LEN;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginSide}>
        <div className={styles.logoWrapper}>
          <div className={styles.avatar} style={{ width: 48, height: 48, borderRadius: 12 }}>
            <Utensils size={24} />
          </div>
        </div>

        <div className={styles.contentWrapper}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Choose your account to start your shift.</p>

          <div className={styles.employeeGrid}>
            {EMPLOYEES.map((emp) => (
              <div 
                key={emp.id}
                className={cn(styles.employeeCard, selectedId === emp.id && styles.selectedEmployee)}
                onClick={() => {
                  setSelectedId(emp.id);
                  setPin("");
                }}
              >
                <div className={styles.avatar}>{emp.initial}</div>
                <div className={styles.employeeName}>{emp.name}</div>
              </div>
            ))}
          </div>

          {selectedId && (
            <div className={styles.pinSection}>
              <p className={styles.pinLabel}>Enter your 6-digit PIN</p>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
                <PinBoxes length={PIN_LEN} valueLength={pin.length} />
              </div>
              
              <NumericKeypad onDigit={onDigit} onBackspace={onBackspace} />
              
              <button 
                className={styles.actionBtn}
                disabled={!canSubmit || loading}
                onClick={handleLogin}
              >
                {loading ? "Authenticating..." : "Start Shift"}
              </button>
              
              <a href="/forgot-pin" className={styles.forgotPin}>Forgot PIN?</a>
            </div>
          )}
        </div>
      </div>

      <div className={styles.previewSide}>
        <div className={styles.mockupContainer}>
          {/* Mock Dashboard UI inside the preview */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 40 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ flex: 1, height: 120, background: 'var(--bg-app)', borderRadius: 24 }} />
            ))}
          </div>
          <div style={{ height: 400, background: 'var(--bg-app)', borderRadius: 32 }} />
        </div>
      </div>
    </div>
  );
}

