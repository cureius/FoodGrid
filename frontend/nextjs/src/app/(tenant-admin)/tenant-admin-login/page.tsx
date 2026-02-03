"use client";

import { useMemo, useState } from "react";
import { adminLogin } from "@/lib/api/admin";
import { isTenantAdminToken } from "@/lib/utils/admin";

// Tenant admin login. Separate from client-admin and staff flows.

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 0 && password.length > 0, [email, password]);

  async function onLogin() {
    setError(null);
    if (!canSubmit) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      const res = await adminLogin({ email: email.trim(), password });
      
      // Check if user has TENANT_ADMIN role
      if (!isTenantAdminToken(res.accessToken)) {
        setError("Access denied. This login is only for tenant administrators. Client admins should use the client admin portal.");
        return;
      }
      
      // Tenant-admin session storage (separate from outlet admin)
      localStorage.setItem("fg_tenant_admin_access_token", res.accessToken);
      localStorage.setItem("fg_tenant_admin_refresh_token", res.refreshToken);
      window.location.href = "/tenant-admin";
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.12)",
    outline: "none",
    background: "rgba(255,255,255,0.9)"
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(0,0,0,0.7)",
    marginBottom: 8
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(ellipse at top, rgba(0,0,0,0.05), transparent 60%), linear-gradient(135deg, var(--bg-secondary), #eef2ff)"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 16,
          background: "rgba(255,255,255,0.85)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.10)",
          border: "1px solid rgba(0,0,0,0.08)",
          padding: 20
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "rgba(0,0,0,0.55)", fontWeight: 700, letterSpacing: 0.6 }}>
            FOODGRID
          </div>
          <h1 style={{ margin: "6px 0 0", fontSize: 22, letterSpacing: -0.2 }}>Tenant Admin Login</h1>
          <div style={{ marginTop: 6, color: "rgba(0,0,0,0.6)", fontSize: 13 }}>
            Sign in to manage client accounts.
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            style={{
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(220, 38, 38, 0.08)",
              border: "1px solid rgba(220, 38, 38, 0.22)",
              color: "rgb(185, 28, 28)",
              fontSize: 13
            }}
          >
            {error}
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="admin@company.com"
              style={inputStyle}
              disabled={loading}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Your password"
                style={inputStyle}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                disabled={loading}
                style={{
                  height: 44,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "rgba(255,255,255,0.9)",
                  cursor: "pointer",
                  fontSize: 13
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            onClick={onLogin}
            disabled={!canSubmit || loading}
            style={{
              width: "100%",
              marginTop: 4,
              padding: "12px 14px",
              borderRadius: 12,
              border: "0",
              background: loading || !canSubmit ? "rgba(79, 70, 229, 0.55)" : "rgb(79, 70, 229)",
              color: "white",
              fontWeight: 700,
              cursor: loading || !canSubmit ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div style={{ marginTop: 6, fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
            This login is only for tenant administrators.
          </div>
        </div>
      </div>
    </div>
  );
}
