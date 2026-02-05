"use client";

import { Settings, User, Bell, Shield, Database, Globe, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div style={{ padding: '32px', background: 'var(--bg-app)', minHeight: '100vh' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>System Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure platform-wide preferences and security</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SettingsTab icon={User} label="Profile Settings" active />
          <SettingsTab icon={Globe} label="Localization" />
          <SettingsTab icon={Bell} label="Notifications" />
          <SettingsTab icon={Shield} label="Security" />
          <SettingsTab icon={Database} label="System & Data" />
        </div>

        <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Profile Settings</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Platform Name</label>
              <input type="text" defaultValue="FoodGrid POS" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Support Email</label>
              <input type="email" defaultValue="support@foodgrid.com" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Default Currency</label>
              <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'white' }}>
                 <option>INR (₹)</option>
                 <option>USD ($)</option>
                 <option>EUR (€)</option>
              </select>
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '10px 0' }} />
            
            <button style={{ alignSelf: 'flex-start', background: 'var(--primary)', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <Save size={18} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ icon: Icon, label, active }: any) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      padding: '12px 16px', 
      borderRadius: '10px', 
      cursor: 'pointer',
      background: active ? 'var(--primary)' : 'transparent',
      color: active ? 'white' : 'var(--text-primary)',
      fontWeight: 600,
      transition: 'all 0.2s'
    }}>
      <Icon size={20} />
      <span>{label}</span>
    </div>
  );
}
