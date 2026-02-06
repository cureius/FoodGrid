"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { DemoRole, DemoFlowStep, DemoHint, DEMO_CONFIG } from '@/constants/demo';
import { fetchDemoToken, setDemoToken, clearDemoTokens } from '@/lib/demo/demoAuth';
import { useRouter } from 'next/navigation';
import { DEMO_FLOWS } from '@/constants/demoFlows';

interface DemoContextType {
  isActive: boolean;
  currentRole: DemoRole;
  currentStep: DemoFlowStep | null;
  activeOrderId: string | null;
  currentHint: DemoHint | null;
  isSwitchingRole: boolean;
  
  activateDemo: () => void;
  exitDemo: () => void;
  switchRole: (role: DemoRole) => Promise<void>;
  showHint: (hint: DemoHint) => void;
  hideHint: () => void;
  setActiveOrderId: (id: string) => void;
}

const DemoContext = createContext<DemoContextType | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [currentRole, setCurrentRole] = useState<DemoRole>('customer');
  const [currentStep, setCurrentStep] = useState<DemoFlowStep | null>(null);
  const [currentHint, setCurrentHint] = useState<DemoHint | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  useEffect(() => {
    // Check if we are in demo mode based on URL or generic "dummy" check for now
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/demo')) {
      setIsActive(true);
    }
  }, []);

  const activateDemo = () => {
    setIsActive(true);
    // Potentially redirect to demo landing
  };

  const exitDemo = () => {
    setIsActive(false);
    clearDemoTokens();
    router.push('/');
  };

  const switchRole = async (role: DemoRole) => {
    setIsSwitchingRole(true);
    try {
      const token = await fetchDemoToken(role);
      if (token) {
        setDemoToken(role, token);
        setCurrentRole(role);
        
        // Load initial flow for the role (POC logic)
        // In a real implementation we would have sophisticated flow matching
        // For now, hardcode to the 'customer-order' flow if role is customer
        if (role === 'customer') {
            const flow = DEMO_FLOWS['customer-order'];
            if (flow && flow.length > 0) {
                const firstStep = flow[0]; // Start with step 1
                setCurrentStep(firstStep);
                if (firstStep.hints.length > 0) {
                    setCurrentHint(firstStep.hints[0]);
                }
            }
        } else {
             setCurrentStep(null);
             setCurrentHint(null);
        }
        
        // Navigate based on role
        if (role === 'customer') router.push(`/demo/customer/menu`);
        else if (role === 'staff') router.push(`/demo/staff/orders`);
        else if (role === 'kitchen') router.push(`/demo/kitchen/queue`);
        else if (role === 'admin') router.push(`/demo/admin/dashboard`);
        else if (role === 'cashier') router.push(`/demo/staff/orders`); // Reuse staff view for now
      }
    } catch (error) {
      console.error("Failed to switch role", error);
    } finally {
      setIsSwitchingRole(false);
    }
  };

  const showHint = (hint: DemoHint) => setCurrentHint(hint);
  const hideHint = () => setCurrentHint(null);

  return (
    <DemoContext.Provider value={{
      isActive,
      currentRole,
      currentStep,
      activeOrderId,
      currentHint,
      isSwitchingRole,
      activateDemo,
      exitDemo,
      switchRole,
      showHint,
      hideHint,
      setActiveOrderId
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
