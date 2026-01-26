'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth';

interface UserProfile {
  id: string;
  mobileNumber: string;
  displayName: string;
  avatarUrl?: string | null;
}

interface CustomerContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const STORAGE_KEY = 'foodgrid-customer-auth';

export function CustomerProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Sync with localStorage on mount (Zustand persist structure)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state) {
          setUser(parsed.state.user || null);
          setToken(parsed.state.token || null);
          setIsAuthenticated(!!parsed.state.isAuthenticated);
        }
      }
    } catch (error) {
      console.error('Failed to parse customer auth from storage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Also subscribe to the Zustand store for real-time changes (login/logout)
  useEffect(() => {
    const unsub = useAuthStore.subscribe((state) => {
      setUser(state.user);
      setToken(state.token);
      setIsAuthenticated(state.isAuthenticated);
    });
    return unsub;
  }, []);

  const contextValue = useMemo(() => ({
    user,
    token,
    isAuthenticated,
    loading,
  }), [user, token, isAuthenticated, loading]);

  return (
    <CustomerContext.Provider value={contextValue}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}
