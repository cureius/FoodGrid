'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/user/login');
  }, [router]);

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'white' 
    }}>
      <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Redirecting to login...</div>
    </div>
  );
}
