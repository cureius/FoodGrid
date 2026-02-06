'use client';

import React, { Suspense, lazy } from 'react';
import { useDemo } from '@/contexts/DemoContext';
import { OutletProvider } from '@/contexts/OutletContext';
import ClientAdminLayout from '@/components/layout/ClientAdminLayout';

const AdminDashboardPage = lazy(() => import('@/app/(client-admin)/client-admin/page'));

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
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: '#6b7280', fontSize: 14 }}>Loading Dashboard...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

export function DemoAdminPage() {
  const { initialized } = useDemo();

  if (!initialized) return <LoadingFallback />;

  return (
    <OutletProvider>
      <ClientAdminLayout>
        <div style={{ paddingBottom: 56 }}>
          <Suspense fallback={<LoadingFallback />}>
            <AdminDashboardPage />
          </Suspense>
        </div>
      </ClientAdminLayout>
    </OutletProvider>
  );
}
