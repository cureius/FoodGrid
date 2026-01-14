"use client";

import { useEffect, useMemo, useState } from "react";
import { getLoginContext, loginWithPin } from "@/lib/api/auth";
import EmployeeDropdown, { type EmployeeListItem } from "@/components/auth/EmployeeDropdown";
import PinBoxes from "@/components/auth/PinBoxes";
import NumericKeypad from "@/components/auth/NumericKeypad";

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
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
      setPin("");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", padding: 24, maxWidth: 520 }}>
      <h1>Employee Login</h1>
      <p>Choose your account to start your shift.</p>

      {error ? <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div> : null}

      <EmployeeDropdown
        employees={employees}
        value={selectedEmployeeId}
        onChange={(id) => {
          setSelectedEmployeeId(id);
          setPin("");
          setError(null);
        }}
      />

      <div style={{ marginTop: 16, marginBottom: 8 }}>Please input your PIN to validate yourself.</div>
      <PinBoxes length={PIN_LEN} valueLength={pin.length} />

      <div style={{ marginTop: 8, marginBottom: 12 }}>
        <a href="/forgot-pin">Forgot PIN?</a>
      </div>

      <NumericKeypad onDigit={onDigit} onBackspace={onBackspace} disabled={submitting} />

      <button onClick={onStartShift} disabled={!canSubmit} style={{ marginTop: 16, padding: "12px 16px" }}>
        {submitting ? "Starting…" : "Start Shift"}
      </button>
    </div>
  );
}
