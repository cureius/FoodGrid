'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import ClientAdminLayout from '@/components/layout/ClientAdminLayout';
import { isClientAdminToken } from '@/lib/utils/admin';
import { OutletProvider } from '@/contexts/OutletContext';

export default function ClientAdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  // Don't show sidebar on login page
  const isLoginPage = pathname === '/client-admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthorized(true);
      return;
    }

    const token = localStorage.getItem('fg_client_admin_access_token');
    if (!token) {
      // No token, redirect to login
      window.location.href = '/client-admin/login';
      return;
    }

    // Check if user has CLIENT_ADMIN role
    if (!isClientAdminToken(token)) {
      // Clear invalid tokens
      localStorage.removeItem('fg_client_admin_access_token');
      localStorage.removeItem('fg_client_admin_refresh_token');
      // Redirect to tenant-admin if they have that token, otherwise to client login
      const tenantToken = localStorage.getItem('fg_tenant_admin_access_token');
      if (tenantToken) {
        window.location.href = '/tenant-admin';
      } else {
        window.location.href = '/client-admin/login';
      }
      return;
    }

    setIsAuthorized(true);
  }, [pathname, isLoginPage]);

  // Show nothing while checking auth
  if (isAuthorized === null) {
    return null;
  }

  // Login page doesn't need the sidebar layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // All other pages get the sidebar layout with outlet provider
  return (
    <OutletProvider>
      <ClientAdminLayout>{children}</ClientAdminLayout>
    </OutletProvider>
  );
}
