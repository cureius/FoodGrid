"use client";

import { useEffect, useState } from "react";
import { Building2, Users, CreditCard, TrendingUp, Activity, CheckCircle2, Clock, AlertCircle } from "lucide-react";

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(d: Date) {
  return d.toLocaleDateString([], { weekday: "long", year: "numeric", month: "short", day: "numeric" });
}

export default function Page() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = localStorage.getItem("fg_tenant_admin_access_token") || localStorage.getItem("fg_admin_access_token");
    if (!t) window.location.href = "/tenant-admin-login";
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const stats = [
    { title: "Total Tenants", value: "24", change: "+3 this month", icon: Building2, color: "var(--info)", bgColor: "rgba(59, 130, 246, 0.1)" },
    { title: "Active Users", value: "156", change: "+12 this week", icon: Users, color: "var(--success)", bgColor: "rgba(16, 185, 129, 0.1)" },
    { title: "Subscriptions", value: "18", change: "6 pending", icon: CreditCard, color: "var(--primary)", bgColor: "rgba(139, 92, 246, 0.1)" },
    { title: "Revenue", value: "$12.4k", change: "+8.2% vs last month", icon: TrendingUp, color: "var(--warning)", bgColor: "rgba(245, 158, 11, 0.1)" },
  ];

  const recentActivity = [
    { type: "success", message: "New tenant 'Café Delight' registered", time: "2 minutes ago" },
    { type: "info", message: "Subscription renewed for 'Urban Eats'", time: "15 minutes ago" },
    { type: "warning", message: "Subscription expiring for 'Pizza Palace'", time: "1 hour ago" },
    { type: "success", message: "New user added to 'Spice Garden'", time: "3 hours ago" },
  ];

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 32 }}>
        <div>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            margin: 0, 
            background: "var(--text-primary)", 
            WebkitBackgroundClip: "text", 
            WebkitTextFillColor: "transparent" 
          }}>
            Dashboard
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: 14 }}>
            Welcome to Tenant Admin Portal
          </p>
        </div>

        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 16, 
          background: "var(--bg-surface)", 
          padding: "12px 20px", 
          borderRadius: 12, 
          boxShadow: "var(--shadow-sm)",
          border: "1px solid var(--border-light)" 
        }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)" }}>{formatTime(now)}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{formatDate(now)}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 32 }}>
        {stats.map((stat, index) => (
          <div key={index} style={{ 
            background: "var(--bg-surface)", 
            borderRadius: 16, 
            padding: 24, 
            boxShadow: "var(--shadow-sm)",
            border: "1px solid var(--border-light)",
            transition: "transform 0.2s, box-shadow 0.2s"
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{stat.title}</p>
                <p style={{ margin: "8px 0 0", fontSize: 32, fontWeight: 700, color: "var(--text-primary)" }}>{stat.value}</p>
                <p style={{ margin: "8px 0 0", fontSize: 12, color: stat.color, fontWeight: 500 }}>{stat.change}</p>
              </div>
              <div style={{ padding: 14, borderRadius: 14, background: stat.bgColor }}>
                <stat.icon size={26} style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24 }}>
        {/* Recent Activity */}
        <div style={{ 
          background: "white", 
          borderRadius: 16, 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden"
        }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--component-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Activity size={20} style={{ color: "var(--info)" }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Recent Activity</h3>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Last 24 hours</span>
          </div>
          <div style={{ padding: 16 }}>
            {recentActivity.map((activity, index) => (
              <div key={index} style={{ 
                display: "flex", 
                alignItems: "flex-start", 
                gap: 12, 
                padding: "12px 8px",
                borderBottom: index < recentActivity.length - 1 ? "1px solid var(--bg-tertiary)" : "none"
              }}>
                <div style={{ 
                  padding: 8, 
                  borderRadius: 8, 
                  background: activity.type === "success" ? "rgba(16, 185, 129, 0.1)" : 
                             activity.type === "warning" ? "rgba(245, 158, 11, 0.1)" : "rgba(59, 130, 246, 0.1)"
                }}>
                  {activity.type === "success" ? <CheckCircle2 size={16} style={{ color: "var(--success)" }} /> :
                   activity.type === "warning" ? <AlertCircle size={16} style={{ color: "var(--warning)" }} /> :
                   <Clock size={16} style={{ color: "var(--info)" }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--text-primary)" }}>{activity.message}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-tertiary)" }}>{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ 
          background: "white", 
          borderRadius: 16, 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden"
        }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--component-border)" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Quick Actions</h3>
          </div>
          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <a href="/tenant-admin/tenants" style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              gap: 12, 
              padding: 20, 
              borderRadius: 12, 
              border: "1px solid var(--component-border)",
              textDecoration: "none",
              transition: "all 0.2s",
              cursor: "pointer"
            }}>
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(59, 130, 246, 0.1)" }}>
                <Building2 size={24} style={{ color: "var(--info)" }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Manage Tenants</span>
            </a>
            <a href="/tenant-admin/users" style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              gap: 12, 
              padding: 20, 
              borderRadius: 12, 
              border: "1px solid var(--component-border)",
              textDecoration: "none",
              transition: "all 0.2s",
              cursor: "pointer"
            }}>
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(16, 185, 129, 0.1)" }}>
                <Users size={24} style={{ color: "var(--success)" }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Manage Users</span>
            </a>
            <a href="/tenant-admin/subscriptions" style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              gap: 12, 
              padding: 20, 
              borderRadius: 12, 
              border: "1px solid var(--component-border)",
              textDecoration: "none",
              transition: "all 0.2s",
              cursor: "pointer"
            }}>
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(139, 92, 246, 0.1)" }}>
                <CreditCard size={24} style={{ color: "var(--primary)" }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Subscriptions</span>
            </a>
            <a href="/tenant-admin/analytics" style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              gap: 12, 
              padding: 20, 
              borderRadius: 12, 
              border: "1px solid var(--component-border)",
              textDecoration: "none",
              transition: "all 0.2s",
              cursor: "pointer"
            }}>
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(245, 158, 11, 0.1)" }}>
                <TrendingUp size={24} style={{ color: "var(--warning)" }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>View Analytics</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
