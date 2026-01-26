'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import UserHeader from '@/components/user/layout/UserHeader';
import BottomNav from '@/components/user/layout/BottomNav';
import CartFloatingBar from '@/components/user/layout/CartFloatingBar';
import AuthGuard from '@/components/user/auth/AuthGuard';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>
        <div className="layout-root">
          <UserHeader />
          
          <main className="layout-main">
            <div className="layout-container">
              {children}
            </div>
          </main>
          <div className="mobile-nav-wrapper">
            <BottomNav />
          </div>

          <style jsx>{`
            .layout-root {
              display: flex;
              flex-direction: column;
              min-height: 100vh;
              background-color: var(--bg-app);
            }
            .layout-main {
              flex: 1;
              overflow-x: hidden;
            }
            .layout-container {
              max-width: 450px;
              margin: 0 auto;
              min-height: calc(100vh - 64px);
              position: relative;
              background: white;
              box-shadow: var(--shadow-lg);
            }
            @media (min-width: 768px) {
              .layout-main {
                padding-bottom: 0;
              }
              .layout-container {
                box-shadow: none;
              }
              .mobile-nav-wrapper {
                display: none;
              }
            }
          `}</style>
        </div>
      </AuthGuard>
    </QueryClientProvider>
  );
}
