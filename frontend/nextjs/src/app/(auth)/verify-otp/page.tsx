"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PinBoxes from "@/components/auth/PinBoxes";
import NumericKeypad from "@/components/auth/NumericKeypad";
import { verifyPinOtp } from "@/lib/api/auth";

const LEN = 6;

function VerifyOtpInner({ searchParams }: { searchParams: URLSearchParams }) {
  const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID ?? "dev-device";
  const challengeId = searchParams.get("challengeId") ?? "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return !!challengeId && otp.length === LEN && !loading;
  }, [challengeId, otp, loading]);

  function onDigit(d: string) {
    setError(null);
    setOtp((v) => (v.length >= LEN ? v : v + d));
  }

  function onBackspace() {
    setError(null);
    setOtp((v) => (v.length ? v.slice(0, -1) : v));
  }

  async function onVerify() {
    if (!canSubmit) return;
    try {
      setLoading(true);
      const res = await verifyPinOtp({ challengeId, otp, deviceId });
      localStorage.setItem("fg_access_token", res.accessToken);
      localStorage.setItem("fg_refresh_token", res.refreshToken);
      window.location.href = "/employee-login";
    } catch (e: any) {
      setError(e?.message ?? "Invalid OTP");
      setOtp("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h1>Enter OTP</h1>
      {error ? <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div> : null}

      <PinBoxes length={LEN} valueLength={otp.length} />
      <NumericKeypad onDigit={onDigit} onBackspace={onBackspace} disabled={loading} />

      <button onClick={onVerify} disabled={!canSubmit} style={{ marginTop: 16, padding: "12px 16px" }}>
        {loading ? "Verifying…" : "Verify"}
      </button>

      <div style={{ marginTop: 12 }}>
        <a href="/employee-login">Back to log in</a>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <VerifyOtpInner searchParams={new URLSearchParams(window.location.search)} />
    </Suspense>
  );
}
