"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { 
  Store, 
  Users, 
  UserCheck, 
  UserX, 
  RefreshCw, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Building2,
  Activity,
  ChevronRight,
  MapPin
} from "lucide-react";
import { listEmployees } from "@/lib/api/clientAdmin";
import { useOutlet } from "@/contexts/OutletContext";

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(d: Date) {
  return d.toLocaleDateString([], { weekday: "long", year: "numeric", month: "short", day: "numeric" });
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: string;
  loading?: boolean;
}

function StatCard({ title, value, subtitle, icon, color, bgColor, trend, loading }: StatCardProps) {
  return (
    <div style={{
      background: "white",
      borderRadius: 20,
      padding: 24,
      boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.04)",
      border: "1px solid rgba(0,0,0,0.04)",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      transition: "all 0.2s ease",
      cursor: "default",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
        }}>
          {icon}
        </div>
        {trend && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            borderRadius: 20,
            background: "rgba(16, 185, 129, 0.1)",
            color: "#10b981",
            fontSize: 12,
            fontWeight: 600,
          }}>
            <TrendingUp size={14} />
            {trend}
          </div>
        )}
      </div>
      <div>
        <div style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#1e293b",
          marginBottom: 4,
          fontFeatureSettings: "'tnum' on, 'lnum' on",
        }}>
          {loading ? (
            <div style={{
              width: 60,
              height: 32,
              background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
              borderRadius: 6,
            }} />
          ) : value}
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#64748b" }}>{title}</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{subtitle}</div>
      </div>
    </div>
  );
}

export default function Page() {
  useEffect(() => {
    const t = localStorage.getItem("fg_client_admin_access_token");
    if (!t) window.location.href = "/client-admin/login";
  }, []);

  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { selectedOutletId, selectedOutlet } = useOutlet();
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  async function load(isRefresh = false) {
    if (!selectedOutletId) {
      setLoading(false);
      setRefreshing(false);
      setEmployees([]);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Load employees for selected outlet
      const emps = await listEmployees(selectedOutletId);
      setEmployees(emps ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, [selectedOutletId]);

  const stats = useMemo(() => {
    const activeEmployees = employees.filter((e) => (e.status ?? "ACTIVE") === "ACTIVE").length;
    const inactiveEmployees = employees.length - activeEmployees;

    return {
      employeesCount: employees.length,
      activeEmployees,
      inactiveEmployees
    };
  }, [employees]);

  const recentEmployees = employees.slice(0, 5);

  return (
    <div style={{ padding: "32px"}}>
      {/* Header */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 20,
        marginBottom: 32,
      }}>
        <div>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            margin: 0,
            background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.5px",
          }}>
            Dashboard
          </h1>
          <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 15 }}>
            Welcome back! Here's an overview of your business.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            background: "white",
            padding: "2px 20px",
            borderRadius: 14,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Clock size={18} style={{ color: "#8b5cf6" }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{formatTime(now)}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{formatDate(now)}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "16px 20px",
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: refreshing ? "not-allowed" : "pointer",
              opacity: refreshing ? 0.7 : 1,
              boxShadow: "0 4px 14px rgba(139, 92, 246, 0.35)",
              transition: "all 0.2s ease",
            }}
          >
            <RefreshCw size={16} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{
          padding: "14px 18px",
          borderRadius: 12,
          background: "rgba(239, 68, 68, 0.08)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          color: "#dc2626",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <Activity size={18} />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 20,
        marginBottom: 32,
      }}>
        <StatCard
          title="Total Employees"
          value={stats.employeesCount}
          subtitle={selectedOutlet ? `For ${selectedOutlet.name}` : "Select an outlet"}
          icon={<Users size={26} />}
          color="#3b82f6"
          bgColor="rgba(59, 130, 246, 0.1)"
          loading={loading}
        />
        <StatCard
          title="Active Employees"
          value={stats.activeEmployees}
          subtitle="Currently enabled"
          icon={<UserCheck size={26} />}
          color="#10b981"
          bgColor="rgba(16, 185, 129, 0.1)"
          loading={loading}
        />
        <StatCard
          title="Inactive Employees"
          value={stats.inactiveEmployees}
          subtitle="Disabled accounts"
          icon={<UserX size={26} />}
          color="#f59e0b"
          bgColor="rgba(245, 158, 11, 0.1)"
          loading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
        gap: 24,
      }}>
        {/* Employees Section */}
        <div style={{
          background: "white",
          borderRadius: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "20px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(59, 130, 246, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Users size={20} style={{ color: "#3b82f6" }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Employees</h3>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{employees.length} total</p>
              </div>
            </div>
            <Link href="/client-admin/employees" style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: "#3b82f6",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}>
              View All <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{ padding: 16 }}>
            {loading ? (
              <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>Loading employees...</div>
            ) : recentEmployees.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <Users size={40} style={{ color: "#cbd5e1", marginBottom: 12 }} />
                <p style={{ color: "#64748b", margin: 0 }}>No employees found</p>
                <Link href="/client-admin/employees" style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 12,
                  padding: "10px 18px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}>
                  Add Employee <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentEmployees.map((emp) => (
                  <div key={emp.id} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    borderRadius: 12,
                    background: "#f8fafc",
                    transition: "all 0.15s ease",
                  }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: emp.avatarUrl 
                        ? `url(${emp.avatarUrl}) center/cover`
                        : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 14,
                    }}>
                      {!emp.avatarUrl && (emp.displayName ?? emp.email ?? "E").slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 2 }}>
                        {emp.displayName ?? "Employee"}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {emp.email ?? "No email"} • {emp.outletName ?? "Unknown outlet"}
                      </div>
                    </div>
                    <div style={{
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: (emp.status ?? "ACTIVE") === "ACTIVE" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      color: (emp.status ?? "ACTIVE") === "ACTIVE" ? "#10b981" : "#ef4444",
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      {emp.status ?? "ACTIVE"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: "#1e293b" }}>Quick Actions</h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}>
          <Link href="/client-admin/outlets" style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: 20,
            borderRadius: 16,
            background: "white",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            textDecoration: "none",
            transition: "all 0.2s ease",
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "rgba(139, 92, 246, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Store size={24} style={{ color: "#8b5cf6" }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>Manage Outlets</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Add or edit outlets</div>
            </div>
          </Link>

          <Link href="/client-admin/employees" style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: 20,
            borderRadius: 16,
            background: "white",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            textDecoration: "none",
            transition: "all 0.2s ease",
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "rgba(59, 130, 246, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Users size={24} style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>Manage Employees</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Add or edit staff</div>
            </div>
          </Link>

          <Link href="/client-admin/orders" style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: 20,
            borderRadius: 16,
            background: "white",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            textDecoration: "none",
            transition: "all 0.2s ease",
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "rgba(16, 185, 129, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Activity size={24} style={{ color: "#10b981" }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>View Orders</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Track all orders</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
