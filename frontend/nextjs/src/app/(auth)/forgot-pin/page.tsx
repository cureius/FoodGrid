"use client";

import { useState } from "react";
import { requestPinOtp } from "@/lib/api/auth";

export default function Page() {
  const deviceId = process.env.NEXT_PUBLIC_DEVICE_ID ?? "dev-device";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRequest() {
    setError(null);
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    try {
      setLoading(true);
      const res = await requestPinOtp({ email: email.trim(), deviceId });
      window.location.href = `/check-email?challengeId=${encodeURIComponent(res.challengeId)}&maskedEmail=${encodeURIComponent(res.maskedEmail)}`;
    } catch (e: any) {
      setError(e?.message ?? "Failed to request PIN");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h1>Forgot PIN?</h1>
      <p>No worries, we’ll send your PIN</p>

      {error ? <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div> : null}

      <label style={{ display: "block", marginBottom: 8 }}>Email</label>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        style={{ width: "100%", padding: 10, marginBottom: 12 }}
      />

      <button onClick={onRequest} disabled={loading} style={{ padding: "12px 16px" }}>
        {loading ? "Requesting…" : "Request PIN"}
      </button>

      <div style={{ marginTop: 12 }}>
        <a href="/employee-login">Back to log in</a>
      </div>
    </div>
  );
}
