'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import LoginSheet from './LoginSheet';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [showLogin, setShowLogin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
    
    // Page list that requiring auth
    const protectedRoutes = ['/user/checkout', '/user/orders', '/user/account'];
    const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

    if (isProtected && !isAuthenticated) {
        // Trigger the visual sheet
        setShowLogin(true);
    }
  }, [isAuthenticated, pathname, router]);

  const handleLoginSuccess = () => {
    setShowLogin(false);
  };

  const handleClose = () => {
    setShowLogin(false);
    const protectedRoutes = ['/user/checkout', '/user/orders', '/user/account'];
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      router.replace('/user');
    }
  };

  if (!isInitialized) return null;

  return (
    <>
      {children}
    </>
  );
}
