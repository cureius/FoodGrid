"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { getCurrentStaff } from "@/lib/api/staff";

type StaffContextType = {
  selectedOutletId: string | null;
  setSelectedOutletId: (id: string | null) => void;
  staffInfo: {
    employeeId: string | null;
    outletId: string | null;
    displayName: string | null;
    roles: string[];
  } | null;
  loading: boolean;
};

const StaffContext = createContext<StaffContextType>({
  selectedOutletId: null,
  setSelectedOutletId: () => {},
  staffInfo: null,
  loading: true,
});

export function StaffProvider({ children }: { readonly children: ReactNode }) {
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);
  const [staffInfo, setStaffInfo] = useState<StaffContextType["staffInfo"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStaffInfo() {
      try {
        const info = await getCurrentStaff();
        if (info?.outletId) {
          setSelectedOutletId(info.outletId);
          setStaffInfo({
            employeeId: info.sub || null,
            outletId: info.outletId || null,
            displayName: info.displayName || null,
            roles: info.groups || [],
          });
        }
      } catch (err) {
        console.error("Failed to load staff info:", err);
        // // If failed, clear tokens and redirect to login
        // if (typeof globalThis.window !== "undefined") {
        //   localStorage.removeItem("fg_staff_access_token");
        //   localStorage.removeItem("fg_staff_refresh_token");
        //   globalThis.window.location.href = "/staff-login";
        // }
        //TODO
      } finally {
        setLoading(false);
      }
    }

    // Only load if we have a token
    const token = typeof globalThis.window !== "undefined" ? localStorage.getItem("fg_staff_access_token") : null;
    if (token) {
      loadStaffInfo();
    } else {
      setLoading(false);
    }
  }, []);

  const contextValue = useMemo(
    () => ({ selectedOutletId, setSelectedOutletId, staffInfo, loading }),
    [selectedOutletId, staffInfo, loading]
  );

  return (
    <StaffContext.Provider value={contextValue}>
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  return useContext(StaffContext);
}
