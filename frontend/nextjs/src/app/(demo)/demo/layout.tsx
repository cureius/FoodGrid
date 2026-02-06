'use client';

import React from 'react';
import StyledComponentsRegistry from '@/lib/registry';
import { DemoProvider } from '@/contexts/DemoContext';
import DemoRoleBar from '@/components/demo/DemoRoleBar';
import DemoOverlay from '@/components/demo/DemoOverlay';

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StyledComponentsRegistry>
      <DemoProvider>
        <div className="demo-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {children}
          <DemoRoleBar />
          <DemoOverlay />
        </div>
      </DemoProvider>
    </StyledComponentsRegistry>
  );
}
