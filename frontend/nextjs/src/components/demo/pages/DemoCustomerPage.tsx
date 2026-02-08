'use client';

import React, { Suspense, lazy, useMemo, useCallback } from 'react';
import { useDemo } from '@/contexts/DemoContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

const RestaurantView = lazy(() => import('@/components/user/menu/RestaurantView'));

function LoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fff',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40,
          height: 40,
          border: '4px solid #e5e7eb',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: '#6b7280', fontSize: 14 }}>Loading Menu...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

export function DemoCustomerPage() {
  const { initialized, outletId } = useDemo();
  const router = useRouter();

  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  }), []);

  const handleBack = useCallback(() => {
    router.push('/demo');
  }, [router]);

  if (!initialized) return <LoadingFallback />;

  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ paddingBottom: 56 }}>
        <Suspense fallback={<LoadingFallback />}>
          <RestaurantView outletId={outletId} onBack={handleBack} />
        </Suspense>
      </div>
    </QueryClientProvider>
  );
}
