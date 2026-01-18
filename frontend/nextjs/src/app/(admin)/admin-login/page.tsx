"use client";

import { useState } from "react";
import { adminLogin } from "@/lib/api/admin";
import Logo from "@/components/Logo";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to decode JWT token
  function decodeJWT(token: string) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
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
      
      // Decode token to check role
      const decoded = decodeJWT(res.accessToken);
      const isSuperAdmin = !decoded?.outletId; // Super admin has no outletId
      
      // Route based on role
      if (isSuperAdmin) {
        // Super admin can manage tenants
        window.location.href = "/admin/tenants";
      } else {
        // Tenant admin goes to employees/outlets management
        window.location.href = "/admin/employees";
      }
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-card)" }}>
      {/* LEFT SIDE: Form */}
      <div style={{ flex: "1 1 50%", padding: "40px", display: "flex", flexDirection: "column" }}>
        {/* Header Logo */}
        <div style={{ marginBottom: 80 }}>
          <Logo />
        </div>

        <div style={{ maxWidth: "420px", margin: "0 auto", width: "100%" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, textAlign: "center", marginBottom: 8 }}>Admin Login</h1>
          <p style={{ color: "var(--text-muted)", textAlign: "center", marginBottom: 40 }}>
            Login as Tenant Admin or Super Admin to manage your system.
          </p>

          <form onSubmit={onLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                <a href="#" style={{ fontSize: "0.85rem" }}>Forgot password?</a>
              </div>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{ color: "#EF4444", fontSize: "0.9rem", textAlign: "center", marginBottom: 24 }}>
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              style={{ 
                marginTop: 16, width: "100%", padding: "16px", borderRadius: "12px",
                background: "var(--primary-blue)",
                color: "white",
                fontSize: "1.1rem", fontWeight: 600,
                boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.2)"
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 32, fontSize: "0.95rem", color: "var(--text-muted)" }}>
            Don't have an account? <a href="#">Contact Support</a>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Mockup */}
      <div style={{ 
        flex: "1 1 50%", background: "var(--bg-app)", padding: "40px",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderLeft: "1px solid var(--border-light)",
        overflow: "hidden"
      }}>
        <div style={{ 
          width: "100%", height: "85%", background: "var(--bg-card)", 
          borderRadius: "32px", border: "12px solid var(--border-light)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          position: "relative", padding: "32px"
        }}>
          {/* Dashboard Preview Elements */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
             <div style={{ height: "12px", width: "120px", background: "var(--bg-app)", borderRadius: "6px" }} />
             <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ height: "24px", width: "24px", background: "var(--bg-app)", borderRadius: "12px" }} />
                <div style={{ height: "24px", width: "24px", background: "var(--bg-app)", borderRadius: "12px" }} />
             </div>
          </div>
          <div style={{ height: "24px", width: "200px", background: "var(--bg-app)", borderRadius: "6px", marginBottom: "8px" }} />
          <div style={{ height: "12px", width: "280px", background: "var(--bg-app)", borderRadius: "6px", marginBottom: "40px" }} />
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "40px" }}>
             <div style={{ height: "120px", background: "var(--bg-app)", borderRadius: "16px" }} />
             <div style={{ height: "120px", background: "var(--bg-app)", borderRadius: "16px" }} />
             <div style={{ height: "120px", background: "var(--bg-app)", borderRadius: "16px" }} />
          </div>

          <div style={{ height: "300px", background: "var(--bg-app)", borderRadius: "24px" }} />
        </div>
      </div>
    </div>
  );
}
