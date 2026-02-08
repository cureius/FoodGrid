'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { DemoProvider } from '@/contexts/DemoContext';
import { DemoOverlay } from '@/components/demo/DemoOverlay';
import { DemoToolbar } from '@/components/demo/DemoToolbar';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <DemoProvider>
        {children}
        <DemoOverlay />
        <DemoToolbar />
      </DemoProvider>
    </QueryClientProvider>
  );
}
