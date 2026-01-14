"use client";

import { useState } from "react";
import { adminLogin } from "@/lib/api/admin";

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogin() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }
    try {
      setLoading(true);
      const res = await adminLogin({ email: email.trim(), password });
      localStorage.setItem("fg_admin_access_token", res.accessToken);
      localStorage.setItem("fg_admin_refresh_token", res.refreshToken);
      window.location.href = "/admin/employees";
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h1>Admin Login</h1>
      {error ? <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div> : null}

      <label style={{ display: "block", marginBottom: 8 }}>Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: 10 }} />

      <label style={{ display: "block", margin: "12px 0 8px" }}>Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: 10 }}
      />

      <button onClick={onLogin} disabled={loading} style={{ marginTop: 16, padding: "12px 16px" }}>
        {loading ? "Logging in…" : "Login"}
      </button>
    </div>
  );
}
