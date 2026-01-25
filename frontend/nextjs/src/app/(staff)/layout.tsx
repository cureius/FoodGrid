'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';

export default function StaffRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  // Don't require auth on login page
  const isLoginPage = pathname === '/staff-login' || pathname === '/staff/staff-login';

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthorized(true);
      return;
    }

    // Check for staff access token
    const token = typeof window !== 'undefined' ? localStorage.getItem('fg_staff_access_token') : null;
    if (!token) {
      // No token, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/staff-login';
      }
      return;
    }

    // Token exists, allow access
    setIsAuthorized(true);
  }, [pathname, isLoginPage]);

  // Show nothing while checking auth
  if (isAuthorized === null) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            border: '4px solid #e2e8f0',
            borderTopColor: '#8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Login page doesn't need the navbar layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // All other pages get the navbar layout
  return <>
    <Navbar/>
    {children}
  </>;
}
