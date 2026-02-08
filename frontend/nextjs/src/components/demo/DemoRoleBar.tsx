"use client";

import React from 'react';
import { useDemo } from '@/contexts/DemoContext';
import { DemoRole } from '@/constants/demo';
import { Users, Utensils, User, Shield, Monitor } from 'lucide-react';

const roles: { id: 'customer' | 'staff' | 'admin', label: string, icon: any }[] = [
  { id: 'customer', label: 'Customer', icon: User },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'admin', label: 'Admin', icon: Monitor },
];

export default function DemoRoleBar() {
  const { activeRole, switchRole, resetDemo } = useDemo();

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#1e293b',
      padding: '8px 16px',
      borderRadius: '16px',
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      zIndex: 9999,
      color: 'white'
    }}>
      <div style={{ marginRight: 12, fontWeight: 'bold', fontSize: 13, color: '#94a3b8' }}>
        DEMO MODE
      </div>

      {roles.map(role => {
        const Icon = role.icon;
        const isActive = activeRole === role.id;
        
        return (
          <button
            key={role.id}
            onClick={() => switchRole(role.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: isActive ? '#3b82f6' : 'transparent',
              color: isActive ? 'white' : '#cbd5e1',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: 500,
              fontSize: 13
            }}
          >
            <Icon size={16} />
            {role.label}
          </button>
        );
      })}

      <div style={{ width: 1, height: 24, backgroundColor: '#334155', margin: '0 8px' }} />

      <button
        onClick={() => resetDemo()}
        style={{
          padding: '8px 12px',
          backgroundColor: 'transparent',
          color: '#ef4444',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600
        }}
      >
        Exit
      </button>
    </div>
  );
}
