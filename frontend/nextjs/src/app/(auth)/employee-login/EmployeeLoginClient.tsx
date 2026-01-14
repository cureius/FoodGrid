"use client";

import { useEffect, useMemo, useState } from "react";
import { getLoginContext, loginWithPin } from "@/lib/api/auth";
import EmployeeDropdown, { type EmployeeListItem } from "@/components/auth/EmployeeDropdown";
import PinBoxes from "@/components/auth/PinBoxes";
import NumericKeypad from "@/components/auth/NumericKeypad";
import Logo from "@/components/Logo";

const PIN_LEN = 6;

export default function EmployeeLoginClient() {
  const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID ?? "dev-device";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [pin, setPin] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const ctx = await getLoginContext(deviceId);
        if (cancelled) return;
        const list = (ctx.employees ?? []) as EmployeeListItem[];
        setEmployees(list);
        setSelectedEmployeeId(list[0]?.id ?? "");
        setError(null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  const canSubmit = useMemo(() => {
    return !loading && !submitting && !!selectedEmployeeId && pin.length === PIN_LEN;
  }, [loading, submitting, selectedEmployeeId, pin]);

  function onDigit(d: string) {
    setError(null);
    setPin((p) => (p.length >= PIN_LEN ? p : p + d));
  }

  function onBackspace() {
    setError(null);
    setPin((p) => (p.length ? p.slice(0, -1) : p));
  }

  async function onStartShift() {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      const res = await loginWithPin({ employeeId: selectedEmployeeId, pin, deviceId });
      localStorage.setItem("fg_access_token", res.accessToken);
      localStorage.setItem("fg_refresh_token", res.refreshToken);
      window.location.href = "/"; // Redirect on success
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
      setPin("");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>Initializing FoodGrid...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-white)" }}>
      {/* LEFT SIDE: Form */}
      <div style={{ flex: "1 1 50%", padding: "40px", display: "flex", flexDirection: "column" }}>
        {/* Header Logo */}
        <div style={{ marginBottom: 80 }}>
          <Logo />
        </div>

        <div style={{ maxWidth: "420px", margin: "0 auto", width: "100%" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, textAlign: "center", marginBottom: 8 }}>Employee Login</h1>
          <p style={{ color: "var(--text-muted)", textAlign: "center", marginBottom: 40 }}>Choose your account to start your shift.</p>

          <EmployeeDropdown
            employees={employees}
            value={selectedEmployeeId}
            onChange={(id) => {
              setSelectedEmployeeId(id);
              setPin("");
              setError(null);
            }}
          />

          <div style={{ 
             textAlign: "center", fontSize: "0.95rem", color: "var(--text-muted)", 
             marginTop: 24, marginBottom: 16 
          }}>
             Please input your PIN to validate yourself.
          </div>
          
          <div style={{ display: "flex", justifyContent: "center" }}>
            <PinBoxes length={PIN_LEN} valueLength={pin.length} />
          </div>

          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <a href="/auth/forgot-pin" style={{ fontSize: "0.9rem" }}>Forgot PIN?</a>
          </div>

          <NumericKeypad onDigit={onDigit} onBackspace={onBackspace} disabled={submitting} />

          {error && (
            <div style={{ color: "#EF4444", fontSize: "0.9rem", textAlign: "center", marginTop: 24 }}>
              {error}
            </div>
          )}

          <button 
            disabled={!canSubmit} 
            onClick={onStartShift}
            style={{ 
              marginTop: 40, width: "100%", padding: "16px", borderRadius: "12px",
              background: canSubmit ? "var(--primary-blue)" : "#E5E7EB",
              color: canSubmit ? "white" : "#9CA3AF",
              fontSize: "1.1rem", fontWeight: 600,
              boxShadow: canSubmit ? "0 4px 6px -1px rgba(59, 130, 246, 0.2)" : "none"
            }}
          >
            {submitting ? "Starting..." : "Start Shift"}
          </button>
        </div>
      </div>

      {/* RIGHT SIDE: Mockup */}
      <div style={{ 
        flex: "1 1 50%", background: "var(--bg-gray)", padding: "40px",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderLeft: "1px solid var(--border-color)",
        overflow: "hidden"
      }}>
        <div style={{ 
          width: "100%", height: "85%", background: "var(--bg-card)", 
          borderRadius: "32px", border: "12px solid var(--mockup-border)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          position: "relative", padding: "32px"
        }}>
          {/* Dashboard Preview Elements */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
             <div style={{ height: "12px", width: "120px", background: "var(--bg-gray)", borderRadius: "6px" }} />
             <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ height: "24px", width: "24px", background: "var(--bg-gray)", borderRadius: "12px" }} />
                <div style={{ height: "24px", width: "24px", background: "var(--bg-gray)", borderRadius: "12px" }} />
             </div>
          </div>
          <div style={{ height: "24px", width: "200px", background: "var(--bg-gray)", borderRadius: "6px", marginBottom: "8px" }} />
          <div style={{ height: "12px", width: "280px", background: "var(--bg-gray)", borderRadius: "6px", marginBottom: "40px" }} />
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "40px" }}>
             <div style={{ height: "120px", background: "var(--bg-gray)", borderRadius: "16px" }} />
             <div style={{ height: "120px", background: "var(--bg-gray)", borderRadius: "16px" }} />
             <div style={{ height: "120px", background: "var(--bg-gray)", borderRadius: "16px" }} />
          </div>

          <div style={{ height: "300px", background: "var(--bg-gray)", borderRadius: "24px" }} />
        </div>
      </div>
    </div>
  );
}
