"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLoginContext, loginWithEmail } from "@/lib/api/auth";
import { Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

// Helper to get deviceId from localStorage or use default
function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem("fg_staff_device_id");
  if (stored) return stored;
  // Generate a default device ID based on browser/device
  const defaultId = `web-${typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 20).replace(/\s/g, "-") : "browser"}-${Date.now()}`;
  localStorage.setItem("fg_staff_device_id", defaultId);
  return defaultId;
}

export default function StaffLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "pin">("email");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Check if already logged in
    const token = typeof window !== "undefined" ? localStorage.getItem("fg_staff_access_token") : null;
    if (token) {
      router.push("/dashboard");
      return;
    }

    // Initialize device ID
    const devId = getDeviceId();
    setDeviceId(devId);

    // Try to get login context to validate device (optional)
    async function initDevice() {
      try {
        await getLoginContext(devId, email);
        // Device is configured
      } catch (err) {
        console.warn("Could not initialize device context:", err);
        // Continue anyway - device will be auto-registered on first login
      }
    }
    initDevice();
  }, [router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !deviceId) {
      setError("Email is required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    // Move to PIN step
    setError(null);
    setSuccess(null);
    console.log("🚀 ~ handleEmailSubmit ~ email:", email)
    setStep("pin");
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 ~ handlePinSubmit ~ deviceId:", deviceId)
    console.log("🚀 ~ handlePinSubmit ~ email:", email)
    console.log("🚀 ~ handlePinSubmit ~ pin:", pin)
    if (!pin || pin.length !== 6 || !deviceId || !email.trim()) {
      setError("Please enter a valid 6-digit PIN");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Use loginWithEmail which handles the entire flow
      const loginResponse = await loginWithEmail({
        email: email.trim(),
        pin: pin,
        deviceId: deviceId,
      });

      if (loginResponse?.accessToken) {
        // Success! Store tokens and redirect
        localStorage.setItem("fg_staff_access_token", loginResponse.accessToken);
        if (loginResponse.refreshToken) {
          localStorage.setItem("fg_staff_refresh_token", loginResponse.refreshToken);
        }
        setSuccess("Login successful! Redirecting...");
        
        // Small delay to show success message
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 500);
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Login failed. Please check your credentials.";
      setError(errorMessage);
      console.error("Login failed:", err);
      
      // If it's a device registration error, stay on PIN step but show clear message
      if (errorMessage.includes("Device not registered") || errorMessage.includes("device")) {
        // Keep on PIN step but show error
        return;
      }
      
      // If it's an email validation error, go back to email step
      if (errorMessage.includes("email") || errorMessage.includes("not found") || errorMessage.includes("Invalid email")) {
        setTimeout(() => {
          setStep("email");
          setPin("");
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("email");
    setPin("");
    setError(null);
    setSuccess(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "white",
          borderRadius: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          padding: "40px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 24px rgba(102, 126, 234, 0.4)",
            }}
          >
            <Lock size={32} style={{ color: "white" }} />
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              margin: "0 0 8px",
              color: "#1e293b",
            }}
          >
            Staff Login
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            {step === "email" ? "Enter your email to continue" : "Enter your 6-digit PIN"}
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "#dc2626",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14,
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              color: "#10b981",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14,
            }}
          >
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleEmailSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="email-input"
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: 8,
                }}
              >
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={18}
                  style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@example.com"
                  required
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "14px 16px 14px 44px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#667eea";
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                width: "100%",
                height: 52,
                borderRadius: 12,
                background:
                  loading || !email.trim()
                    ? "#e2e8f0"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: loading || !email.trim() ? "#94a3b8" : "white",
                fontWeight: 700,
                fontSize: 15,
                border: "none",
                cursor: loading || !email.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow:
                  loading || !email.trim()
                    ? "none"
                    : "0 4px 14px rgba(102, 126, 234, 0.35)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!loading && email.trim()) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.45)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  loading || !email.trim()
                    ? "none"
                    : "0 4px 14px rgba(102, 126, 234, 0.35)";
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  Continue <Lock size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePinSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="pin-input"
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: 8,
                }}
              >
                6-Digit PIN
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={18}
                  style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="pin-input"
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setPin(value);
                  }}
                  placeholder="000000"
                  required
                  disabled={loading}
                  maxLength={6}
                  style={{
                    width: "100%",
                    padding: "14px 16px 14px 44px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    fontSize: 18,
                    letterSpacing: "8px",
                    textAlign: "center",
                    fontFamily: "monospace",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#667eea";
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  marginTop: 8,
                  textAlign: "center",
                }}
              >
                Logging in as: <strong>{email}</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  background: "white",
                  color: "#64748b",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || pin.length !== 6}
                style={{
                  flex: 2,
                  height: 52,
                  borderRadius: 12,
                  background:
                    loading || pin.length !== 6
                      ? "#e2e8f0"
                      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: loading || pin.length !== 6 ? "#94a3b8" : "white",
                  fontWeight: 700,
                  fontSize: 15,
                  border: "none",
                  cursor: loading || pin.length !== 6 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  boxShadow:
                    loading || pin.length !== 6
                      ? "none"
                      : "0 4px 14px rgba(102, 126, 234, 0.35)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading && pin.length === 6) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.45)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    loading || pin.length !== 6
                      ? "none"
                      : "0 4px 14px rgba(102, 126, 234, 0.35)";
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Logging in...
                  </>
                ) : (
                  <>
                    Login <Lock size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div
          style={{
            marginTop: 24,
            paddingTop: 24,
            borderTop: "1px solid #f1f5f9",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
            Device ID: <code style={{ fontSize: 11 }}>{deviceId.slice(0, 20)}...</code>
          </p>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
