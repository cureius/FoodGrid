"use client";

import { useMemo, useState } from "react";
import { adminLogin } from "@/lib/api/clientAdmin";
import { isClientAdminToken } from "@/lib/utils/admin";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

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
      
      if (!isClientAdminToken(res.accessToken)) {
        setError("Access denied. This login is only for client administrators. Tenant admins should use the tenant admin portal.");
        return;
      }
      
      localStorage.setItem("fg_client_admin_access_token", res.accessToken);
      localStorage.setItem("fg_client_admin_refresh_token", res.refreshToken);
      window.location.href = "/client-admin";
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
    border: "1px solid var(--border-light)",
    outline: "none",
    background: "var(--component-bg)",
    color: "var(--text-primary)"
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: 8
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "var(--bg-app)"
      }}
    >
      <div style={{ position: 'absolute', top: 24, right: 24 }}>
        <ThemeSwitcher />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 16,
          background: "var(--bg-surface)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--border-light)",
          padding: 20
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, letterSpacing: 0.6 }}>
            FOODGRID
          </div>
          <h1 style={{ margin: "6px 0 0", fontSize: 22, letterSpacing: -0.2, color: "var(--text-primary)" }}>Client Admin Login</h1>
          <div style={{ marginTop: 6, color: "var(--text-secondary)", fontSize: 13 }}>
            Sign in to manage outlets and staff.
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            style={{
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 12,
              background: "var(--danger-light)",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
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
                  border: "1px solid var(--border-light)",
                  background: "var(--component-bg)",
                  color: "var(--text-primary)",
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
              background: loading || !canSubmit ? "var(--primary-light)" : "var(--primary)",
              color: "white",
              fontWeight: 700,
              cursor: loading || !canSubmit ? "not-allowed" : "pointer",
              transition: "var(--transition-normal)"
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-tertiary)" }}>
            This login is only for client administrators.
          </div>
        </div>
      </div>
    </div>
  );
}
