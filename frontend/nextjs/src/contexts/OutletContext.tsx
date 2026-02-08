'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { listOutlets } from '@/lib/api/clientAdmin';

interface Outlet {
  id: string;
  name: string;
  timezone?: string;
  status?: string;
}

interface OutletContextType {
  selectedOutletId: string | null;
  selectedOutlet: Outlet | null;
  outlets: Outlet[];
  setSelectedOutletId: (outletId: string | null) => void;
  loading: boolean;
  refreshOutlets: () => Promise<void>;
}

const OutletContext = createContext<OutletContextType | undefined>(undefined);

export function OutletProvider({ children }: { readonly children: ReactNode }) {
  const [selectedOutletId, setSelectedOutletIdState] = useState<string | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine if we are in the client-admin section or staff section
  const isClientAdmin = typeof window !== "undefined" && (
    window.location.pathname.startsWith('/client-admin') || 
    window.location.pathname.startsWith('/tenant-admin') ||
    window.location.pathname.startsWith('/internal-admin')
  );

  const STORAGE_KEY = isClientAdmin ? 'fg_client_admin_selected_outlet_id' : 'fg_staff_selected_outlet_id';

  // Load selected outlet from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSelectedOutletIdState(stored);
    }
  }, [STORAGE_KEY]);

  const refreshOutlets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listOutlets();
      setOutlets(data || []);
    } catch (error: any) {
      console.error('Failed to fetch outlets:', error);
      
      // If we are in staff section, we might only have access to one outlet
      if (!isClientAdmin) {
        const staffOutletJson = localStorage.getItem('fg_staff_outlet');
        if (staffOutletJson) {
          try {
            const staffOutlet = JSON.parse(staffOutletJson);
            setOutlets([staffOutlet]);
            if (!selectedOutletId) {
              setSelectedOutletIdState(staffOutlet.id);
            }
          } catch (e) {
            setOutlets([]);
          }
          return;
        }
      }
      setOutlets([]);
    } finally {
      setLoading(false);
    }
  }, [selectedOutletId, isClientAdmin]);

  // Fetch outlets on mount
  useEffect(() => {
    refreshOutlets();
  }, [refreshOutlets]);

  // Auto-select first outlet if none selected and outlets are available
  useEffect(() => {
    if (!selectedOutletId && outlets.length > 0 && !loading) {
      const envOutletId = process.env.NEXT_PUBLIC_OUTLET_ID;
      if (envOutletId && outlets.some((o) => o.id === envOutletId)) {
        setSelectedOutletIdState(envOutletId);
        localStorage.setItem(STORAGE_KEY, envOutletId);
      } else {
        setSelectedOutletIdState(outlets[0].id);
        localStorage.setItem(STORAGE_KEY, outlets[0].id);
      }
    }
  }, [outlets, selectedOutletId, loading, STORAGE_KEY]);

  const setSelectedOutletId = useCallback((outletId: string | null) => {
    setSelectedOutletIdState(outletId);
    if (outletId) {
      localStorage.setItem(STORAGE_KEY, outletId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [STORAGE_KEY]);

  const selectedOutlet = useMemo(() => {
    return outlets.find((o) => o.id === selectedOutletId) || null;
  }, [outlets, selectedOutletId]);

  const contextValue = useMemo(() => ({
    selectedOutletId,
    selectedOutlet,
    outlets,
    setSelectedOutletId,
    loading,
    refreshOutlets,
  }), [selectedOutletId, selectedOutlet, outlets, setSelectedOutletId, loading, refreshOutlets]);

  return (
    <OutletContext.Provider value={contextValue}>
      {children}
    </OutletContext.Provider>
  );
}

export function useOutlet() {
  const context = useContext(OutletContext);
  if (context === undefined) {
    throw new Error('useOutlet must be used within an OutletProvider');
  }
  return context;
}
