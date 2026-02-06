'use client';

import React from 'react';
import { DemoProvider } from '@/contexts/DemoContext';
import { DemoOverlay } from '@/components/demo/DemoOverlay';
import { DemoToolbar } from '@/components/demo/DemoToolbar';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      {children}
      <DemoOverlay />
      <DemoToolbar />
    </DemoProvider>
  );
}
