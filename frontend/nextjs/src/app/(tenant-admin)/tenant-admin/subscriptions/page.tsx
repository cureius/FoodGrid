"use client";

import { useEffect, useState } from "react";
import { CreditCard, Building2, CheckCircle2, AlertCircle, Search, Filter } from "lucide-react";
import { listTenants, type TenantResponse } from "@/lib/api/admin";
import { isTenantAdmin } from "@/lib/utils/admin";

export default function SubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<TenantResponse[]>([]);

  useEffect(() => {
    async function load() {
       try {
         const res = await listTenants();
         setTenants(res);
       } finally {
         setLoading(false);
       }
    }
    load();
  }, []);

  return (
    <div style={{ padding: '32px', background: 'var(--bg-app)', minHeight: '100vh' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>Subscriptions</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage tenant plans and billing cycles</p>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '16px', alignItems: 'center' }}>
           <div style={{ flex: 1, position: 'relative' }}>
             <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
             <input type="text" placeholder="Search by tenant..." style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
           </div>
           <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'white', fontWeight: 600 }}>
             <Filter size={18} /> Filter
           </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-muted)', textAlign: 'left' }}>
              <th style={{ padding: '16px', fontSize: '14px', fontWeight: 600 }}>Tenant</th>
              <th style={{ padding: '16px', fontSize: '14px', fontWeight: 600 }}>Plan</th>
              <th style={{ padding: '16px', fontSize: '14px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '16px', fontSize: '14px', fontWeight: 600 }}>Renewal Date</th>
              <th style={{ padding: '16px', fontSize: '14px', fontWeight: 600, textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center' }}>Loading...</td></tr>
            ) : tenants.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center' }}>No subscription data found</td></tr>
            ) : tenants.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {t.id}</div>
                </td>
                <td style={{ padding: '16px' }}>
                   <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(75, 112, 245, 0.1)', color: 'var(--primary)', fontSize: '12px', fontWeight: 700 }}>PRO PLAN</span>
                </td>
                <td style={{ padding: '16px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-green)', fontSize: '14px', fontWeight: 600 }}>
                      <CheckCircle2 size={16} /> Active
                   </div>
                </td>
                <td style={{ padding: '16px', fontSize: '14px' }}>
                   {new Date(new Date(t.createdAt).getTime() + 30 * 86400000).toLocaleDateString()}
                </td>
                <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700 }}>
                   ₹1,999/mo
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
