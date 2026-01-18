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
    { title: "Total Tenants", value: "24", change: "+3 this month", icon: Building2, color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.1)" },
    { title: "Active Users", value: "156", change: "+12 this week", icon: Users, color: "#10b981", bgColor: "rgba(16, 185, 129, 0.1)" },
    { title: "Subscriptions", value: "18", change: "6 pending", icon: CreditCard, color: "#8b5cf6", bgColor: "rgba(139, 92, 246, 0.1)" },
    { title: "Revenue", value: "$12.4k", change: "+8.2% vs last month", icon: TrendingUp, color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.1)" },
  ];

  const recentActivity = [
    { type: "success", message: "New tenant 'Café Delight' registered", time: "2 minutes ago" },
    { type: "info", message: "Subscription renewed for 'Urban Eats'", time: "15 minutes ago" },
    { type: "warning", message: "Subscription expiring for 'Pizza Palace'", time: "1 hour ago" },
    { type: "success", message: "New user added to 'Spice Garden'", time: "3 hours ago" },
  ];

  return (
    <div style={{ padding: 32, maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 32 }}>
        <div>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            margin: 0, 
            background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)", 
            WebkitBackgroundClip: "text", 
            WebkitTextFillColor: "transparent" 
          }}>
            Dashboard
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            Welcome to Tenant Admin Portal
          </p>
        </div>

        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 16, 
          background: "white", 
          padding: "12px 20px", 
          borderRadius: 12, 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)" 
        }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#1e293b" }}>{formatTime(now)}</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>{formatDate(now)}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 32 }}>
        {stats.map((stat, index) => (
          <div key={index} style={{ 
            background: "white", 
            borderRadius: 16, 
            padding: 24, 
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            transition: "transform 0.2s, box-shadow 0.2s"
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b", fontWeight: 500 }}>{stat.title}</p>
                <p style={{ margin: "8px 0 0", fontSize: 32, fontWeight: 700, color: "#1e293b" }}>{stat.value}</p>
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
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Activity size={20} style={{ color: "#3b82f6" }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Recent Activity</h3>
            </div>
            <span style={{ fontSize: 12, color: "#64748b" }}>Last 24 hours</span>
          </div>
          <div style={{ padding: 16 }}>
            {recentActivity.map((activity, index) => (
              <div key={index} style={{ 
                display: "flex", 
                alignItems: "flex-start", 
                gap: 12, 
                padding: "12px 8px",
                borderBottom: index < recentActivity.length - 1 ? "1px solid #f1f5f9" : "none"
              }}>
                <div style={{ 
                  padding: 8, 
                  borderRadius: 8, 
                  background: activity.type === "success" ? "rgba(16, 185, 129, 0.1)" : 
                             activity.type === "warning" ? "rgba(245, 158, 11, 0.1)" : "rgba(59, 130, 246, 0.1)"
                }}>
                  {activity.type === "success" ? <CheckCircle2 size={16} style={{ color: "#10b981" }} /> :
                   activity.type === "warning" ? <AlertCircle size={16} style={{ color: "#f59e0b" }} /> :
                   <Clock size={16} style={{ color: "#3b82f6" }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, color: "#1e293b" }}>{activity.message}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>{activity.time}</p>
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
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0" }}>
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
              border: "1px solid #e2e8f0",
              textDecoration: "none",
              transition: "all 0.2s",
              cursor: "pointer"
            }}>
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(59, 130, 246, 0.1)" }}>
                <Building2 size={24} style={{ color: "#3b82f6" }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#1e293b" }}>Manage Tenants</span>
            </a>
            <a href="/tenant-admin/users" style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              gap: 12, 
              padding: 20, 
              borderRadius: 12, 
              border: "1px solid #e2e8f0",
              textDecoration: "none",
              transition: "all 0.2s",
              cursor: "pointer"
            }}>
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(16, 185, 129, 0.1)" }}>
                <Users size={24} style={{ color: "#10b981" }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#1e293b" }}>Manage Users</span>
            </a>
            <a href="/tenant-admin/subscriptions" style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              gap: 12, 
              padding: 20, 
              borderRadius: 12, 
              border: "1px solid #e2e8f0",
              textDecoration: "none",
              transition: "all 0.2s",
              cursor: "pointer"
            }}>
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(139, 92, 246, 0.1)" }}>
                <CreditCard size={24} style={{ color: "#8b5cf6" }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#1e293b" }}>Subscriptions</span>
            </a>
            <a href="/tenant-admin/analytics" style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              gap: 12, 
              padding: 20, 
              borderRadius: 12, 
              border: "1px solid #e2e8f0",
              textDecoration: "none",
              transition: "all 0.2s",
              cursor: "pointer"
            }}>
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(245, 158, 11, 0.1)" }}>
                <TrendingUp size={24} style={{ color: "#f59e0b" }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#1e293b" }}>View Analytics</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
