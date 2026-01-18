'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import TenantAdminLayout from '@/components/layout/TenantAdminLayout';
import { isTenantAdminToken } from '@/lib/utils/admin';

export default function TenantAdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  // Don't show sidebar on login page
  const isLoginPage = pathname === '/tenant-admin-login';

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthorized(true);
      return;
    }

    const token = localStorage.getItem('fg_tenant_admin_access_token');
    if (!token) {
      // No token, redirect to login
      window.location.href = '/tenant-admin-login';
      return;
    }

    // Check if user has TENANT_ADMIN role
    if (!isTenantAdminToken(token)) {
      // Clear invalid tokens
      localStorage.removeItem('fg_tenant_admin_access_token');
      localStorage.removeItem('fg_tenant_admin_refresh_token');
      // Redirect to client-admin if they have that token, otherwise to tenant login
      const clientToken = localStorage.getItem('fg_client_admin_access_token');
      if (clientToken) {
        window.location.href = '/client-admin';
      } else {
        window.location.href = '/tenant-admin-login';
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

  // All other pages get the sidebar layout
  return <TenantAdminLayout>{children}</TenantAdminLayout>;
}
