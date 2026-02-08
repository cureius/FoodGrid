"use client";
import React from 'react';
import { useParams } from 'next/navigation';

export default function DemoKitchenPlaceholder() {
  const params = useParams();
  const slug = params?.slug as string[];

  return (
    <div style={{ padding: 40, color: 'white' }}>
      <h1>Kitchen Demo {slug?.join('/')}</h1>
      <p>This is a placeholder for the Kitchen Demo capabilities.</p>
    </div>
  );
}
