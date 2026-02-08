"use client";
import React from 'react';
import { useParams } from 'next/navigation';

export default function DemoCustomerPlaceholder() {
  const params = useParams();
  const slug = params?.slug as string[];

  return (
    <div style={{ padding: 40, color: 'white' }}>
      <h1>Customer Demo {slug?.join('/')}</h1>
      <p>This is a placeholder for the Customer Demo capabilities.</p>
      
      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        {/* Mock Menu Item */}
        <div style={{ border: '1px solid #334155', padding: 16, borderRadius: 8, width: 200 }}>
             <h3>Classic Burger</h3>
             <button 
                data-demo-anchor="customer.kiosk.start" // Temporarily reuse the start anchor or use the one from flow
                style={{ background: '#22c55e', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, marginTop: 10, cursor: 'pointer' }}
             >
                Add to Cart
             </button>
        </div>
      </div>
    </div>
  );
}
