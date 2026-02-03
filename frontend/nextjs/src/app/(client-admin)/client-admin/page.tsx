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
  MapPin,
  ShoppingBag
} from "lucide-react";
import { listEmployees, listOrders, type OrderResponse } from "@/lib/api/clientAdmin";
import { useOutlet } from "@/contexts/OutletContext";

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(d: Date) {
  return d.toLocaleDateString([], { weekday: "long", year: "numeric", month: "short", day: "numeric" });
}

type TimeRange = "today" | "thisWeek" | "thisMonth" | "thisQuarter" | "thisYear";

function getTimeRangeDates(range: TimeRange): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "thisWeek":
      const dayOfWeek = start.getDay();
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      break;
    case "thisMonth":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    case "thisQuarter":
      const quarter = Math.floor(start.getMonth() / 3);
      start.setMonth(quarter * 3);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth((quarter + 1) * 3);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    case "thisYear":
      start.setMonth(0);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11);
      end.setDate(31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

function isOrderCompleted(order: OrderResponse): boolean {
  // Orders are considered completed/served if they are SERVED, BILLED, or PAID
  return order.status === "SERVED" || order.status === "BILLED" || order.status === "PAID";
}

function isOrderInTimeRange(order: OrderResponse, start: Date, end: Date): boolean {
  if (!order.createdAt) return false;
  const orderDate = new Date(order.createdAt);
  return orderDate >= start && orderDate <= end;
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
      background: "var(--bg-surface)",
      borderRadius: 20,
      padding: 24,
      boxShadow: "var(--shadow-md)",
      border: "1px solid var(--border-light)",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      transition: "var(--transition-normal)",
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
            color: "var(--success)",
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
          color: "var(--text-primary)",
          marginBottom: 4,
          fontFeatureSettings: "'tnum' on, 'lnum' on",
        }}>
          {loading ? (
            <div style={{
              width: 60,
              height: 32,
              background: "linear-gradient(90deg, var(--bg-tertiary) 25%, var(--component-border) 50%, var(--bg-tertiary) 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
              borderRadius: 6,
            }} />
          ) : value}
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{subtitle}</div>
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
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("today");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  async function load(isRefresh = false) {
    if (!selectedOutletId) {
      setLoading(false);
      setRefreshing(false);
      setEmployees([]);
      setOrders([]);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Load employees for selected outlet
      const emps = await listEmployees(selectedOutletId);
      setEmployees(emps ?? []);

      // Load orders for selected outlet (fetch a large number to cover all time ranges)
      setOrdersLoading(true);
      const allOrders = await listOrders(1000, selectedOutletId);
      setOrders(allOrders ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setOrdersLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [selectedOutletId]);

  const stats = useMemo(() => {
    const activeEmployees = employees.filter((e) => (e.status ?? "ACTIVE") === "ACTIVE").length;
    const inactiveEmployees = employees.length - activeEmployees;

    // Calculate completed orders for the selected time range
    const { start, end } = getTimeRangeDates(timeRange);
    const completedOrders = orders.filter(
      (order) => isOrderCompleted(order) && isOrderInTimeRange(order, start, end)
    ).length;

    return {
      employeesCount: employees.length,
      activeEmployees,
      inactiveEmployees,
      completedOrders
    };
  }, [employees, orders, timeRange]);

  const recentEmployees = employees.slice(0, 5);

  return (
    <div style={{ padding: "32px", background: "var(--bg-app)", minHeight: "100%", color: "var(--text-primary)" }}>
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
            color: "var(--text-primary)",
            letterSpacing: "-0.5px",
          }}>
            Dashboard
          </h1>
          <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: 15 }}>
            Welcome back! Here's an overview of your business.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            background: "var(--bg-surface)",
            padding: "2px 20px",
            borderRadius: 14,
            boxShadow: "var(--shadow-sm)",
            border: "1px solid var(--border-light)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Clock size={18} style={{ color: "var(--primary)" }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{formatTime(now)}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{formatDate(now)}</div>
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
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)",
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
          color: "var(--danger)",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <Activity size={18} />
          {error}
        </div>
      )}

      {/* Time Range Selector */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 24,
        flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>Time Range:</span>
        {(["today", "thisWeek", "thisMonth", "thisQuarter", "thisYear"] as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: timeRange === range 
                ? "var(--primary)"
                : "var(--component-bg)",
              color: timeRange === range ? "white" : "var(--text-secondary)",
              fontSize: 13,
              fontWeight: timeRange === range ? 600 : 500,
              cursor: "pointer",
              boxShadow: timeRange === range 
                ? "var(--shadow-md)"
                : "var(--shadow-sm)",
              transition: "all 0.2s ease",
              textTransform: "capitalize",
            }}
          >
            {range === "thisWeek" ? "This Week" :
             range === "thisMonth" ? "This Month" :
             range === "thisQuarter" ? "This Quarter" :
             range === "thisYear" ? "This Year" : "Today"}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 20,
        marginBottom: 32,
      }}>
        <StatCard
          title="Completed Orders"
          value={stats.completedOrders}
          subtitle={timeRange === "today" ? "Today" :
                   timeRange === "thisWeek" ? "This week" :
                   timeRange === "thisMonth" ? "This month" :
                   timeRange === "thisQuarter" ? "This quarter" : "This year"}
          icon={<ShoppingBag size={26} />}
          color="var(--primary)"
          bgColor="rgba(139, 92, 246, 0.1)"
          loading={loading || ordersLoading}
        />
        <StatCard
          title="Total Employees"
          value={stats.employeesCount}
          subtitle={selectedOutlet ? `For ${selectedOutlet.name}` : "Select an outlet"}
          icon={<Users size={26} />}
          color="var(--info)"
          bgColor="rgba(59, 130, 246, 0.1)"
          loading={loading}
        />
        <StatCard
          title="Active Employees"
          value={stats.activeEmployees}
          subtitle="Currently enabled"
          icon={<UserCheck size={26} />}
          color="var(--success)"
          bgColor="rgba(16, 185, 129, 0.1)"
          loading={loading}
        />
        <StatCard
          title="Inactive Employees"
          value={stats.inactiveEmployees}
          subtitle="Disabled accounts"
          icon={<UserX size={26} />}
          color="var(--warning)"
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
          background: "var(--bg-surface)",
          borderRadius: 20,
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border-light)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-light)",
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
                <Users size={20} style={{ color: "var(--info)" }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Employees</h3>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>{employees.length} total</p>
              </div>
            </div>
            <Link href="/client-admin/employees" style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: "var(--primary)",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}>
              View All <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{ padding: 16 }}>
            {loading ? (
              <div style={{ padding: 20, textAlign: "center", color: "var(--text-secondary)" }}>Loading employees...</div>
            ) : recentEmployees.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <Users size={40} style={{ color: "var(--text-tertiary)", marginBottom: 12 }} />
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>No employees found</p>
                <Link href="/client-admin/employees" style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 12,
                  padding: "10px 18px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, var(--info) 0%, #2563eb 100%)",
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
                    background: "var(--bg-tertiary)",
                    transition: "all 0.15s ease",
                  }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: emp.avatarUrl 
                        ? `url(${emp.avatarUrl}) center/cover`
                        : "linear-gradient(135deg, var(--info) 0%, #2563eb 100%)",
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
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                        {emp.displayName ?? "Employee"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {emp.email ?? "No email"} • {emp.outletName ?? "Unknown outlet"}
                      </div>
                    </div>
                    <div style={{
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: (emp.status ?? "ACTIVE") === "ACTIVE" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      color: (emp.status ?? "ACTIVE") === "ACTIVE" ? "var(--success)" : "var(--danger)",
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
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: "var(--text-primary)" }}>Quick Actions</h3>
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
            background: "var(--bg-surface)",
            border: "1px solid var(--border-light)",
            boxShadow: "var(--shadow-sm)",
            textDecoration: "none",
            transition: "all 0.2s ease",
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--bg-tertiary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Store size={24} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Manage Outlets</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Add or edit outlets</div>
            </div>
          </Link>

          <Link href="/client-admin/employees" style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: 20,
            borderRadius: 16,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-light)",
            boxShadow: "var(--shadow-sm)",
            textDecoration: "none",
            transition: "all 0.2s ease",
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--bg-tertiary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Users size={24} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Manage Employees</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Add or edit staff</div>
            </div>
          </Link>

          <Link href="/client-admin/orders" style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: 20,
            borderRadius: 16,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-light)",
            boxShadow: "var(--shadow-sm)",
            textDecoration: "none",
            transition: "all 0.2s ease",
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--bg-tertiary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Activity size={24} style={{ color: "var(--success)" }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>View Orders</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Track all orders</div>
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
