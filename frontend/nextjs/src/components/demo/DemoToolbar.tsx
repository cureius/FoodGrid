'use client';

import React from 'react';
import { useDemo } from '@/contexts/DemoContext';

export function DemoToolbar() {
  const { activeRole, switchRole, resetDemo, flowStarted, currentStepIndex, flow } = useDemo();

  const progress = flowStarted ? ((currentStepIndex + 1) / flow.length) * 100 : 0;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 56,
      background: '#0f172a',
      borderTop: '1px solid #1e293b',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 12,
      zIndex: 9997,
    }}>
      {/* Demo badge */}
      <span style={{
        fontSize: 10,
        fontWeight: 800,
        background: '#ef4444',
        color: 'white',
        padding: '3px 8px',
        borderRadius: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
        flexShrink: 0,
      }}>
        DEMO
      </span>

      {/* Progress bar */}
      {flowStarted && (
        <div style={{
          flex: '0 0 80px',
          height: 4,
          background: '#1e293b',
          borderRadius: 2,
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: '#10b981',
            borderRadius: 2,
            transition: 'width 0.3s',
          }} />
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Role switcher */}
      {(['customer', 'staff', 'admin'] as const).map(role => (
        <button
          key={role}
          onClick={() => switchRole(role)}
          style={{
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            textTransform: 'capitalize',
            transition: 'all 0.2s',
            background: activeRole === role ? getRoleColor(role) : '#1e293b',
            color: activeRole === role ? 'white' : '#64748b',
          }}
        >
          {getRoleIcon(role)} {role}
        </button>
      ))}

      {/* Reset */}
      <button
        onClick={resetDemo}
        style={{
          padding: '6px 12px',
          fontSize: 11,
          fontWeight: 700,
          borderRadius: 6,
          border: '1px solid #334155',
          cursor: 'pointer',
          background: 'transparent',
          color: '#94a3b8',
          marginLeft: 4,
        }}
      >
        Reset
      </button>

      {/* Exit */}
      <a
        href="/"
        style={{
          padding: '6px 12px',
          fontSize: 11,
          fontWeight: 700,
          borderRadius: 6,
          color: '#ef4444',
          textDecoration: 'none',
        }}
      >
        Exit
      </a>
    </div>
  );
}

function getRoleColor(role: string): string {
  switch (role) {
    case 'staff': return '#3b82f6';
    case 'admin': return '#8b5cf6';
    case 'customer': return '#10b981';
    default: return '#64748b';
  }
}

function getRoleIcon(role: string): string {
  switch (role) {
    case 'staff': return '\u{1F4CB}';
    case 'admin': return '\u{1F4CA}';
    case 'customer': return '\u{1F37D}';
    default: return '';
  }
}
