"use client";

import { useState } from "react";
import { adminLogin } from "@/lib/api/admin";
import Logo from "@/components/Logo";
import { Building2, Users } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginType, setLoginType] = useState<"tenant-admin" | "client-admin" | null>(null);

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
    if (!loginType) {
      setError("Please select an admin type");
      return;
    }
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
      const isTenantAdmin = !decoded?.outletId; // Tenant admin (super admin) has no outletId
      
      // Route based on role
      if (isTenantAdmin) {
        // Tenant admin manages tenants/clients - redirect to tenant-admin routes
        window.location.href = "/tenant-admin/tenants";
      } else {
        // Client admin manages outlets and employees - redirect to admin routes
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
            Choose your admin type to continue
          </p>

          {/* Admin Type Selection */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "12px", 
            marginBottom: "32px" 
          }}>
            <button
              type="button"
              onClick={() => setLoginType("tenant-admin")}
              style={{
                padding: "16px",
                borderRadius: "12px",
                border: `2px solid ${loginType === "tenant-admin" ? "var(--primary)" : "var(--border-light)"}`,
                background: loginType === "tenant-admin" ? "rgba(75, 112, 245, 0.1)" : "transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => {
                if (loginType !== "tenant-admin") {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.background = "rgba(75, 112, 245, 0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (loginType !== "tenant-admin") {
                  e.currentTarget.style.borderColor = "var(--border-light)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <Building2 size={24} color={loginType === "tenant-admin" ? "var(--primary)" : "var(--text-muted)"} />
              <span style={{ 
                fontSize: "0.9rem", 
                fontWeight: 600,
                color: loginType === "tenant-admin" ? "var(--primary)" : "var(--text-muted)"
              }}>
                Tenant Admin
              </span>
              <span style={{ 
                fontSize: "0.75rem", 
                color: "var(--text-muted)",
                textAlign: "center"
              }}>
                Manage tenants/clients
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLoginType("client-admin")}
              style={{
                padding: "16px",
                borderRadius: "12px",
                border: `2px solid ${loginType === "client-admin" ? "var(--primary)" : "var(--border-light)"}`,
                background: loginType === "client-admin" ? "rgba(75, 112, 245, 0.1)" : "transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => {
                if (loginType !== "client-admin") {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.background = "rgba(75, 112, 245, 0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (loginType !== "client-admin") {
                  e.currentTarget.style.borderColor = "var(--border-light)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <Users size={24} color={loginType === "client-admin" ? "var(--primary)" : "var(--text-muted)"} />
              <span style={{ 
                fontSize: "0.9rem", 
                fontWeight: 600,
                color: loginType === "client-admin" ? "var(--primary)" : "var(--text-muted)"
              }}>
                Client Admin
              </span>
              <span style={{ 
                fontSize: "0.75rem", 
                color: "var(--text-muted)",
                textAlign: "center"
              }}>
                Manage outlets/employees
              </span>
            </button>
          </div>

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
              disabled={loading || !loginType}
              style={{ 
                marginTop: 16, 
                width: "100%", 
                padding: "16px", 
                borderRadius: "12px",
                background: loginType ? "var(--primary-blue)" : "var(--border-light)",
                color: loginType ? "white" : "var(--text-muted)",
                fontSize: "1.1rem", 
                fontWeight: 600,
                boxShadow: loginType ? "0 4px 6px -1px rgba(59, 130, 246, 0.2)" : "none",
                cursor: loginType ? "pointer" : "not-allowed",
                transition: "all 0.2s ease"
              }}
            >
              {loading ? "Logging in..." : loginType === "tenant-admin" ? "Login as Tenant Admin" : loginType === "client-admin" ? "Login as Client Admin" : "Select Admin Type"}
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
