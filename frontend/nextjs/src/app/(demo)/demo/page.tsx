"use client";

import React from 'react';
import { useDemo } from '@/contexts/DemoContext';
import { Play } from 'lucide-react';

export default function DemoLandingPage() {
  const { switchRole } = useDemo();

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: 'white',
      padding: 24
    }}>
      <div style={{ textAlign: 'center', maxWidth: 600 }}>
        <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 16, letterSpacing: '-1px' }}>
          Experience FoodGrid Live
        </h1>
        <p style={{ fontSize: 18, color: '#94a3b8', marginBottom: 40, lineHeight: 1.6 }}>
          Try the full platform with a guided, interactive demo. 
          No signup required. Switch roles instantly.
        </p>

        <button
          onClick={() => switchRole('customer')}
          style={{
            background: '#3b82f6',
            color: 'white',
            padding: '16px 32px',
            borderRadius: '12px',
            fontSize: 18,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.5)'
          }}
        >
          <Play size={24} fill="currentColor" />
          Start Interactive Demo
        </button>

        <div style={{ marginTop: 60, display: 'flex', gap: 40, justifyContent: 'center', color: '#64748b' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>Live</div>
            <div style={{ fontSize: 13 }}>Real Backend</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>Safe</div>
            <div style={{ fontSize: 13 }}>Isolated Data</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>Full</div>
            <div style={{ fontSize: 13 }}>All Features</div>
          </div>
        </div>
      </div>
    </div>
  );
}
