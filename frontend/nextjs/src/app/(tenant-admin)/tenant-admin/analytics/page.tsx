"use client";

import { useEffect, useState } from "react";
import { getGlobalAnalytics, type GlobalAnalyticsResponse } from "@/lib/api/admin";
import { BarChart3, TrendingUp, Building2, Users, CreditCard, Activity, ArrowUpRight, ArrowDownRight, LayoutDashboard, Calendar } from "lucide-react";
import { isTenantAdmin } from "@/lib/utils/admin";

export default function AnalyticsPage() {
  useEffect(() => {
    const t = localStorage.getItem("fg_tenant_admin_access_token");
    if (!t || !isTenantAdmin()) {
      if (typeof globalThis !== 'undefined' && globalThis.location) {
        globalThis.location.href = "/tenant-admin-login";
      }
      return;
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GlobalAnalyticsResponse | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const res = await getGlobalAnalytics();
      setData(res);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading platform analytics...</div>;
  if (error) return <div style={{ padding: 40, color: 'var(--status-red)' }}>Error: {error}</div>;
  if (!data) return null;

  return (
    <div style={{ padding: '32px', background: 'var(--bg-app)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>Platform Analytics</h1>
          <p style={{ color: 'var(--text-muted)' }}>Deep dive into system performance and growth</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: 'white', padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <Calendar size={16} />
            Last 30 Days
          </div>
        </div>
      </div>

      {/* Grid for Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <StatCard title="Total Revenue" value={`₹${data.totalRevenue.toLocaleString()}`} change="+12.5%" trend="up" icon={TrendingUp} color="var(--primary)" />
        <StatCard title="Total Tenants" value={data.totalTenants.toString()} change="+3" trend="up" icon={Building2} color="var(--info)" />
        <StatCard title="Active Users" value={data.totalUsers.toString()} change="+45" trend="up" icon={Users} color="var(--success)" />
        <StatCard title="Active Subscriptions" value={data.activeSubscriptions.toString()} change="-1" trend="down" icon={CreditCard} color="var(--warning)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Revenue Chart Placeholder */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Revenue Growth</h3>
            <div style={{ background: 'var(--bg-muted)', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>Monthly</div>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '20px', padding: '0 20px' }}>
            {data.revenueByMonth.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '100%', 
                  background: 'var(--primary)', 
                  height: `${(m.amount / 20000) * 100}%`, 
                  borderRadius: '6px 6px 0 0',
                  minHeight: '20px',
                  opacity: 0.8 + (i * 0.05)
                }}></div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{m.month}</span>
              </div>
            ))}
            {/* Fillers for visual */}
            {['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((m) => (
               <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '100%', background: 'var(--bg-muted)', height: '10%', borderRadius: '6px 6px 0 0' }}></div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tenants */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Recent Signups</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.recentTenants.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--bg-muted)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={20} color="var(--primary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleDateString()}</div>
                </div>
                <ArrowUpRight size={16} color="var(--text-muted)" />
              </div>
            ))}
          </div>
          <button style={{ width: '100%', marginTop: '24px', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'transparent', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
            View All Tenants
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend, icon: Icon, color }: any) {
  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ padding: '12px', borderRadius: '12px', background: `${color}1A` }}>
          <Icon size={24} color={color} />
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px', 
          padding: '4px 8px', 
          borderRadius: '20px', 
          background: trend === 'up' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: trend === 'up' ? 'var(--status-green)' : 'var(--status-red)',
          fontSize: '12px',
          fontWeight: 700
        }}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </div>
      </div>
      <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
