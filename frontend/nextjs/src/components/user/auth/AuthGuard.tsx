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
    const isPublic = pathname === '/user/login';
    const isUserRoute = pathname.startsWith('/user');

    if (isUserRoute && !isPublic && !isAuthenticated) {
        router.replace(`/user/login?redirect=${pathname}`);
    }
  }, [isAuthenticated, pathname, router]);

  const handleLoginSuccess = () => {
    setShowLogin(false);
  };

  const handleClose = () => {
    setShowLogin(false);
    if (!isAuthenticated) {
      router.replace('/user/login');
    }
  };

  if (!isInitialized) return null;

  return (
    <>
      {children}
    </>
  );
}
