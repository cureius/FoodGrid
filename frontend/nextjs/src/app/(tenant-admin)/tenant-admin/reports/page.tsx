"use client";

import { FileText, Download, Filter, Calendar, BarChart, Users, Building2, CreditCard } from "lucide-react";

export default function ReportsPage() {
  const reports = [
    { title: "Monthly Revenue Report", desc: "Detailed breakdown of revenue across all tenants", icon: CreditCard, color: "var(--primary)" },
    { title: "Tenant Onboarding Summary", desc: "Growth metrics and new signups for the current month", icon: Building2, color: "var(--info)" },
    { title: "User Activity Audit", desc: "Admin and staff login/action history", icon: Users, color: "var(--success)" },
    { title: "System Health & Logs", desc: "Technical performance and error rate summary", icon: BarChart, color: "var(--warning)" },
  ];

  return (
    <div style={{ padding: '32px', background: 'var(--bg-app)', minHeight: '100vh' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>Reports & Exports</h1>
        <p style={{ color: 'var(--text-muted)' }}>Generate and download platform-wide data summaries</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {reports.map((report, i) => (
          <div key={i} style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)', display: 'flex', gap: '20px' }}>
             <div style={{ padding: '16px', borderRadius: '12px', background: `${report.color}1A`, alignSelf: 'flex-start' }}>
                <report.icon size={28} color={report.color} />
             </div>
             <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{report.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>{report.desc}</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                   <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}>
                      <Calendar size={16} /> Select Date
                   </button>
                   <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}>
                      <Download size={16} /> Download CSV
                   </button>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
