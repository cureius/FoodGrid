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
  ShoppingBag,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
  AlertTriangle,
  Info
} from "lucide-react";
import { 
  listEmployees, 
  listOrders, 
  getDashboardAnalytics, 
  type OrderResponse, 
  type DashboardAnalytics 
} from "@/lib/api/clientAdmin";
import { useOutlet } from "@/contexts/OutletContext";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import dashStyles from './dashboard/Dashboard.module.css';

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
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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
      setAnalytics(null);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const emps = await listEmployees(selectedOutletId);
      setEmployees(emps ?? []);

      setAnalyticsLoading(true);
      const { start, end } = getTimeRangeDates(timeRange);
      try {
        const data = await getDashboardAnalytics(selectedOutletId, start.toISOString(), end.toISOString());
        setAnalytics(data);
      } catch (err: any) {
        console.error("Failed to load analytics:", err);
      } finally {
        setAnalyticsLoading(false);
      }

      setOrdersLoading(true);
      const allOrders = await listOrders(50, selectedOutletId);
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
  }, [selectedOutletId, timeRange]);

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
    <div className={dashStyles.dashboardPage} style={{ background: "var(--bg-app)", minHeight: "100%", color: "var(--text-primary)" }}>
      {/* Header */}
      <div className={dashStyles.dashboardHeader}>
        <div>
          <h1 className={dashStyles.dashboardTitle} style={{
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
            data-demo-action="refresh-dashboard"
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
              fontWeight: 700,
              cursor: refreshing ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(139, 92, 246, 0.3)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(139, 92, 246, 0.3)";
            }}
          >
            <RefreshCw size={20} style={{ animation: refreshing ? "spin 2s linear infinite" : "none" }} />
            <span className={dashStyles.refreshBtnText}>{refreshing ? "Refreshing..." : "Refresh Data"}</span>
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className={dashStyles.timeRangeSelector} style={{
        display: "flex",
        gap: 8,
        marginBottom: 24,
        background: "var(--bg-surface)",
        padding: 6,
        borderRadius: 14,
        width: "fit-content",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--border-light)",
      }}>
        {(["today", "thisWeek", "thisMonth", "thisQuarter", "thisYear"] as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              background: timeRange === range ? "var(--primary)" : "transparent",
              color: timeRange === range ? "white" : "var(--text-secondary)",
              fontSize: 13,
              fontWeight: timeRange === range ? 600 : 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
              textTransform: "capitalize",
            }}
          >
            {range.replace(/([A-Z])/g, ' $1')}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className={dashStyles.statsGrid} style={{
        display: "grid",
        gap: 20,
        marginBottom: 32,
      }}>
        <StatCard
          title="Total Revenue"
          value={analytics ? `₹${analytics.summary.totalRevenue.toLocaleString()}` : "₹0"}
          subtitle={timeRange === "today" ? "Today's earnings" : "Revenue in period"}
          trend={analytics?.summary.growthRate && analytics.summary.growthRate > 0 ? `${analytics.summary.growthRate}%` : undefined}
          icon={<DollarSign size={26} />}
          color="var(--success)"
          bgColor="rgba(16, 185, 129, 0.1)"
          loading={loading || analyticsLoading}
        />
        <StatCard
          title="Completed Orders"
          value={analytics ? analytics.summary.totalOrders : 0}
          subtitle="Orders processed"
          icon={<ShoppingBag size={26} />}
          color="var(--primary)"
          bgColor="rgba(139, 92, 246, 0.1)"
          loading={loading || analyticsLoading}
        />
        <StatCard
          title="Avg Order Value"
          value={analytics ? `₹${analytics.summary.averageOrderValue.toFixed(0)}` : "₹0"}
          subtitle="Revenue per ticket"
          icon={<TrendingUp size={26} />}
          color="var(--warning)"
          bgColor="rgba(245, 158, 11, 0.1)"
          loading={loading || analyticsLoading}
        />
        <StatCard
          title="Active Employees"
          value={stats.activeEmployees}
          subtitle={`${employees.length} members total`}
          icon={<Users size={26} />}
          color="var(--info)"
          bgColor="rgba(59, 130, 246, 0.1)"
          loading={loading}
        />
      </div>

      {/* Analytics Insights */}
      <AnimatePresence>
        {analytics && analytics.insights.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)",
              borderRadius: 20,
              padding: "24px",
              marginBottom: 32,
              border: "1px solid rgba(139, 92, 246, 0.1)",
              display: "flex",
              gap: 16,
              alignItems: "flex-start"
            }}
          >
            <div style={{ 
              background: "var(--primary)", 
              color: "white", 
              padding: 10, 
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)"
            }}>
              <Zap size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Smart Insights</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {analytics.insights.map((insight: string, i: number) => (
                  <div key={i} style={{ 
                    background: "var(--bg-surface)", 
                    padding: "10px 16px", 
                    borderRadius: 12, 
                    fontSize: 13, 
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-light)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    boxShadow: "var(--shadow-sm)"
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)" }} />
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visualizations Grid */}
      <div className={dashStyles.vizGrid} style={{
        display: "grid",
        gap: 24,
        marginBottom: 32
      }}>
        {/* Hourly Trend Chart */}
        <div style={{
          background: "var(--bg-surface)",
          borderRadius: 20,
          padding: 24,
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border-light)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(139, 92, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Orders by Hour</h3>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>Peak occupancy patterns</p>
              </div>
            </div>
          </div>
          <div className={dashStyles.chartContainer} style={{ width: '100%' }}>
            {analyticsLoading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw size={24} style={{ animation: "spin 2s linear infinite" }} color="var(--text-tertiary)" />
              </div>
            ) : analytics?.hourlyTrend?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.hourlyTrend.map((d: any) => ({ ...d, hourLabel: `${d.hour}:00` }))}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="hourLabel" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-lg)', background: 'var(--bg-surface)' }}
                    itemStyle={{ fontSize: 12, fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="count" name="Orders" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                <BarChart3 size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                <p>Not enough data for trend</p>
              </div>
            )}
          </div>
        </div>

        {/* Channel Distribution */}
        <div style={{
          background: "var(--bg-surface)",
          borderRadius: 20,
          padding: 24,
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border-light)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--success)" }}>
                <PieChartIcon size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Channel Revenue</h3>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>Source contributions</p>
              </div>
            </div>
          </div>
          <div className={dashStyles.chartContainer} style={{ width: '100%', display: 'flex' }}>
            {analyticsLoading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw size={24} style={{ animation: "spin 2s linear infinite" }} color="var(--text-tertiary)" />
              </div>
            ) : analytics?.channelSplit?.length ? (
              <>
                <ResponsiveContainer width="55%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.channelSplit}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="revenue"
                      nameKey="label"
                    >
                      {analytics.channelSplit.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={[
                          '#8b5cf6', // Indigo
                          '#10b981', // Emerald
                          '#f59e0b', // Amber
                          '#3b82f6', // Blue
                        ][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-lg)', background: 'var(--bg-surface)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ width: '45%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
                  {analytics.channelSplit.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ 
                        width: 12, height: 12, borderRadius: 3, 
                        background: ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6'][i % 4] 
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>₹{item.revenue.toLocaleString()}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {analytics.summary.totalRevenue > 0 ? ((item.revenue / analytics.summary.totalRevenue) * 100).toFixed(0) : '0'}%
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                <PieChartIcon size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                <p>No channel data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={dashStyles.bottomInfoGrid} style={{
        display: "grid",
        gap: 24,
        marginBottom: 40
      }}>
        {/* Best Performing Outlet */}
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
            gap: 12
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(139, 92, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
              <Store size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Best Performing Outlet</h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>Across all of your stores</p>
            </div>
          </div>
          <div style={{ padding: 16 }}>
            {analyticsLoading ? (
               <div style={{ padding: 40, textAlign: 'center' }}>
                 <RefreshCw size={24} style={{ animation: "spin 2s linear infinite" }} color="var(--text-tertiary)" />
               </div>
            ) : analytics?.topOutletsByRevenue?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {analytics.topOutletsByRevenue.map((item: any, i: number) => (
                  <div key={i} style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 16, 
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: 'var(--bg-tertiary)',
                  }}>
                    <div style={{ 
                      width: 28, height: 28, borderRadius: 8, 
                      background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', border: '1px solid var(--border-light)'
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.count} orders</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>₹{item.revenue.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>Region Top</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>No outlet performance data</div>
            )}
          </div>
        </div>

        {/* Top Selling Items */}
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
            gap: 12
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(245, 158, 11, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--warning)" }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Top Selling Items</h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>Ranked by revenue</p>
            </div>
          </div>
          <div style={{ padding: 16 }}>
            {analyticsLoading ? (
               <div style={{ padding: 40, textAlign: 'center' }}>
                 <RefreshCw size={24} style={{ animation: "spin 2s linear infinite" }} color="var(--text-tertiary)" />
               </div>
            ) : analytics?.topItemsByRevenue?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {analytics.topItemsByRevenue.map((item: any, i: number) => (
                  <div key={i} style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 16, 
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: 'var(--bg-tertiary)',
                  }}>
                    <div style={{ 
                      width: 28, height: 28, borderRadius: 8, 
                      background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', border: '1px solid var(--border-light)'
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.count} orders</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>₹{item.revenue.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>Hot Seller</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>No item data found</div>
            )}
          </div>
        </div>

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
              <div style={{ padding: 40, textAlign: "center" }}>
                <RefreshCw size={24} style={{ animation: "spin 2s linear infinite" }} color="var(--text-tertiary)" />
              </div>
            ) : recentEmployees.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <Users size={40} style={{ color: "var(--text-tertiary)", marginBottom: 12 }} />
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>No employees found</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentEmployees.map((emp) => (
                  <div key={emp.id} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: "var(--bg-tertiary)",
                    transition: "all 0.15s ease",
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
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
                        {emp.role ?? "Staff"} • {emp.outletName ?? "Active"}
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
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>Quick Actions</h3>
        <div className={dashStyles.quickActionsGrid} style={{
          display: "grid",
          gap: 16,
        }}>
          {[
            { href: "/client-admin/outlets", icon: <Store size={22} />, label: "Manage Outlets", sub: "Add or edit stores", color: "var(--primary)" },
            { href: "/client-admin/employees", icon: <Users size={22} />, label: "Staff Management", sub: "Roles and permissions", color: "var(--info)" },
            { href: "/client-admin/orders", icon: <Activity size={22} />, label: "Live Orders", sub: "Track current activity", color: "var(--success)" },
            { href: "/client-admin/menu", icon: <BarChart3 size={22} />, label: "Menu Editor", sub: "Prices and items", color: "var(--warning)" }
          ].map((action, i) => (
            <Link key={i} href={action.href} style={{
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
                color: action.color
              }}>
                {action.icon}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{action.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{action.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

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
