"use client";

import { Bell, AlertCircle, Info, CheckCircle2, Search, Settings, Filter } from "lucide-react";

export default function NotificationsPage() {
  const notifications = [
    { title: "New Tenant Registered", message: "Café Delight has joined the platform. Review their details in the Tenants section.", time: "10 mins ago", type: "info" },
    { title: "Gateway Error: 'Urban Eats'", message: "Razorpay credentials verification failed for Urban Eats. Action required.", time: "2 hours ago", type: "error" },
    { title: "Subscription Renewed", message: "Spice Garden has successfully renewed their PRO plan.", time: "5 hours ago", type: "success" },
    { title: "System Maintenance", message: "Scheduled maintenance tonight at 02:00 AM UTC.", time: "1 day ago", type: "warning" },
  ];

  return (
    <div style={{ padding: '32px', background: 'var(--bg-app)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>System Notifications</h1>
          <p style={{ color: 'var(--text-muted)' }}>Stay updated with platform events and alerts</p>
        </div>
        <button style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={18} /> Notification Settings
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '16px' }}>
           <div style={{ flex: 1, position: 'relative' }}>
             <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
             <input type="text" placeholder="Search notifications..." style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
           </div>
           <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'white', fontWeight: 600 }}>
             <Filter size={18} /> All Types
           </button>
        </div>

        <div>
          {notifications.map((n, i) => (
            <div key={i} style={{ padding: '24px', borderBottom: i < notifications.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', gap: '20px', transition: 'background 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-muted)'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
               <div style={{ 
                 padding: '12px', 
                 borderRadius: '12px', 
                 background: n.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : n.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : n.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                 alignSelf: 'flex-start'
               }}>
                  {n.type === 'error' ? <AlertCircle size={20} color="var(--status-red)" /> : 
                   n.type === 'success' ? <CheckCircle2 size={20} color="var(--status-green)" /> :
                   n.type === 'warning' ? <AlertCircle size={20} color="var(--warning)" /> :
                   <Info size={20} color="var(--info)" />}
               </div>
               <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <h4 style={{ fontWeight: 700, margin: 0 }}>{n.title}</h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{n.time}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{n.message}</p>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
