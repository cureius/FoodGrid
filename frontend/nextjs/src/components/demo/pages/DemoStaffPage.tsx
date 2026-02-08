'use client';

import React, { Suspense, lazy } from 'react';
import { useDemo } from '@/contexts/DemoContext';
import { OutletProvider } from '@/contexts/OutletContext';
import { StaffProvider } from '@/contexts/StaffContext';
import { Navbar } from '@/components/ui/Navbar';

const StaffOrdersPage = lazy(() => import('@/app/(client-admin)/client-admin/orders/page'));

function LoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-secondary, #f8f9fa)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40,
          height: 40,
          border: '4px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: '#6b7280', fontSize: 14 }}>Loading POS...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

export function DemoStaffPage() {
  const { initialized } = useDemo();

  if (!initialized) return <LoadingFallback />;

  return (
    <OutletProvider>
      <StaffProvider>
        <div style={{ paddingBottom: 56 }}>
          <Navbar />
          <Suspense fallback={<LoadingFallback />}>
            <StaffOrdersPage />
          </Suspense>
        </div>
      </StaffProvider>
    </OutletProvider>
  );
}
