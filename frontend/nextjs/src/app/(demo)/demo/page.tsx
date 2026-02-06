'use client';

import React from 'react';
import { useDemo } from '@/contexts/DemoContext';

const FLOW_PREVIEW = [
  { icon: '\u{1F4CB}', label: 'Create Order' },
  { icon: '\u{1F373}', label: 'Kitchen Prep' },
  { icon: '\u2705', label: 'Mark Served' },
  { icon: '\u{1F4B0}', label: 'Generate Bill' },
  { icon: '\u{1F4B3}', label: 'Record Payment' },
  { icon: '\u{1F4CA}', label: 'View Analytics' },
];

export default function DemoLandingPage() {
  const { startFlow, initialized } = useDemo();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px 96px',
      color: 'white',
      textAlign: 'center',
    }}>
      {/* Badge */}
      <div style={{
        fontSize: 11,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: 2,
        color: '#10b981',
        marginBottom: 16,
      }}>
        Interactive Demo
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize: 'clamp(28px, 5vw, 44px)',
        fontWeight: 900,
        lineHeight: 1.1,
        marginBottom: 16,
        maxWidth: 600,
      }}>
        Experience a real restaurant workflow
      </h1>

      <p style={{
        fontSize: 16,
        color: '#94a3b8',
        maxWidth: 480,
        lineHeight: 1.6,
        marginBottom: 40,
      }}>
        Walk through a complete order lifecycle — from creation to payment — using the same interface your staff will use every day.
      </p>

      {/* Flow preview chips */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
        marginBottom: 40,
        maxWidth: 500,
      }}>
        {FLOW_PREVIEW.map((step, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            color: '#cbd5e1',
          }}>
            <span>{step.icon}</span>
            <span>{step.label}</span>
            {i < FLOW_PREVIEW.length - 1 && (
              <span style={{ color: '#334155', marginLeft: 4 }}>&rarr;</span>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={startFlow}
        disabled={!initialized}
        style={{
          padding: '14px 36px',
          fontSize: 16,
          fontWeight: 800,
          background: initialized ? '#10b981' : '#334155',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          cursor: initialized ? 'pointer' : 'wait',
          transition: 'all 0.2s',
          boxShadow: initialized ? '0 4px 24px rgba(16, 185, 129, 0.4)' : 'none',
        }}
      >
        {initialized ? 'Start Guided Demo' : 'Preparing demo...'}
      </button>

      <p style={{ fontSize: 12, color: '#475569', marginTop: 16 }}>
        No account needed. Takes about 2 minutes.
      </p>
    </div>
  );
}
