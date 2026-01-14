"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resendPinOtp } from "@/lib/api/auth";

function CheckEmailInner() {
  const params = useSearchParams();
  const challengeId = params.get("challengeId") ?? "";
  const maskedEmail = params.get("maskedEmail") ?? "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onResend() {
    if (!challengeId) return;
    try {
      setLoading(true);
      setError(null);
      await resendPinOtp({ challengeId });
    } catch (e: any) {
      setError(e?.message ?? "Failed to resend");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h1>Check your email</h1>
      <p>We sent a PIN to {maskedEmail || "your email"}</p>

      {error ? <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div> : null}

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <button
          onClick={() =>
            (window.location.href = `/verify-otp?challengeId=${encodeURIComponent(challengeId)}`)
          }
          disabled={!challengeId}
        >
          Enter OTP
        </button>
        <button onClick={onResend} disabled={!challengeId || loading}>
          {loading ? "Resending…" : "Resend"}
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <a href="/employee-login">Back to log in</a>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <CheckEmailInner />
    </Suspense>
  );
}
