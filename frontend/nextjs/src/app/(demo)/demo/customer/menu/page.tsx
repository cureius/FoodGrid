"use client";

import React from 'react';
import { useDemo } from '@/contexts/DemoContext';
import RestaurantView from '@/components/user/menu/RestaurantView';

export default function DemoCustomerMenuPage() {
  const { currentRole, isActive } = useDemo();

  // Use the demo outlet ID from config
  const demoOutletId = 'demo-outlet-1';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <RestaurantView 
        outletId={demoOutletId} 
        onBack={() => {
          // In demo mode, back could go to demo landing
          window.location.href = '/demo';
        }}
        isDemoMode={true}
      />
    </div>
  );
}
