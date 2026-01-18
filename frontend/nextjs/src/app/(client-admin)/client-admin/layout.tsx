'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import ClientAdminLayout from '@/components/layout/ClientAdminLayout';

export default function ClientAdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Don't show sidebar on login page
  const isLoginPage = pathname === '/client-admin/login';

  useEffect(() => {
    const token = localStorage.getItem('fg_client_admin_access_token');
    setIsAuthenticated(!!token);
  }, [pathname]);

  // Show nothing while checking auth
  if (isAuthenticated === null && !isLoginPage) {
    return null;
  }

  // Login page doesn't need the sidebar layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // All other pages get the sidebar layout
  return <ClientAdminLayout>{children}</ClientAdminLayout>;
}
