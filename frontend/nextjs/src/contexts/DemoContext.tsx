'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchDemoToken, resetDemoData, DemoTokenResponse } from '@/lib/api/demo';
import { DEFAULT_DEMO_FLOW, DemoFlowStep } from '@/lib/demo/flows';
import { resolveScreenForCapability } from '@/lib/demo/capabilities';
import { checkDemoBlocked } from '@/lib/demo/guards';

interface DemoState {
  isDemo: boolean;
  initialized: boolean;
  activeRole: 'customer' | 'staff' | 'admin';
  currentStepIndex: number;
  tokens: Record<string, DemoTokenResponse>;
  outletId: string;
  orderId: string | null;
  flowStarted: boolean;
}

interface DemoContextType extends DemoState {
  switchRole: (role: 'customer' | 'staff' | 'admin') => void;
  advanceFlow: () => void;
  goToStep: (index: number) => void;
  startFlow: () => void;
  resetDemo: () => Promise<void>;
  currentStep: DemoFlowStep | null;
  flow: DemoFlowStep[];
  notifyApiResponse: (url: string, method: string, data: any) => void;
}

const DemoContext = createContext<DemoContextType | null>(null);

export function useDemo(): DemoContextType {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within a DemoProvider');
  return ctx;
}

const DEMO_OUTLET_ID = 'demo-outlet-1';

function injectStaffToken(token: string) {
  localStorage.setItem('fg_staff_access_token', token);
  localStorage.setItem('fg_client_admin_selected_outlet_id', DEMO_OUTLET_ID);
}

function injectAdminToken(token: string) {
  localStorage.setItem('fg_client_admin_access_token', token);
  localStorage.setItem('fg_client_admin_selected_outlet_id', DEMO_OUTLET_ID);
}

function injectCustomerToken(token: string) {
  // Zustand persist format for foodgrid-customer-auth
  const zustandState = {
    state: {
      token,
      isAuthenticated: true,
      customer: {
        id: 'demo-customer-1',
        displayName: 'Demo Customer',
        mobileNumber: '9876543210',
        email: 'demo-customer@foodgrid.com',
      },
    },
    version: 0,
  };
  localStorage.setItem('foodgrid-customer-auth', JSON.stringify(zustandState));
  document.cookie = `fg_customer_token=${token}; path=/; max-age=86400; SameSite=Lax`;
}

function showDemoBlockedToast(message: string) {
  const toast = document.createElement('div');
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '72px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#ef4444',
    color: 'white',
    padding: '8px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    zIndex: '100000',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    transition: 'opacity 0.3s',
  });
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<DemoState>({
    isDemo: true,
    initialized: false,
    activeRole: 'staff',
    currentStepIndex: 0,
    tokens: {},
    outletId: DEMO_OUTLET_ID,
    orderId: null,
    flowStarted: false,
  });

  const stateRef = useRef(state);
  stateRef.current = state;
  const originalFetchRef = useRef<typeof window.fetch | null>(null);

  // Fetch all three tokens on mount
  useEffect(() => {
    let cancelled = false;

    async function initTokens() {
      try {
        const [staffRes, adminRes, customerRes] = await Promise.all([
          fetchDemoToken('staff'),
          fetchDemoToken('admin'),
          fetchDemoToken('customer'),
        ]);

        if (cancelled) return;

        const tokens: Record<string, DemoTokenResponse> = {
          staff: staffRes,
          admin: adminRes,
          customer: customerRes,
        };

        // Inject staff token by default
        injectStaffToken(staffRes.accessToken);

        setState(prev => ({ ...prev, initialized: true, tokens }));
      } catch (err) {
        console.error('Failed to initialize demo tokens:', err);
      }
    }

    initTokens();
    return () => { cancelled = true; };
  }, []);

  // Patch fetch for demo guards and domain event detection
  useEffect(() => {
    if (!state.initialized) return;

    const origFetch = window.fetch;
    originalFetchRef.current = origFetch;

    window.fetch = async function demoFetch(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method ?? 'GET';

      // Check guards
      const blocked = checkDemoBlocked(method, url);
      if (blocked) {
        showDemoBlockedToast(blocked);
        return new Response(JSON.stringify({ error: blocked }), { status: 403 });
      }

      const response = await origFetch.call(window, input, init);

      // Clone response to inspect for domain events
      if (response.ok && stateRef.current.flowStarted) {
        try {
          const cloned = response.clone();
          const contentType = cloned.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const data = await cloned.json();
            notifyApiResponse(url, method, data);
          }
        } catch {
          // ignore parse errors
        }
      }

      return response;
    };

    return () => {
      window.fetch = origFetch;
    };
  }, [state.initialized]); // eslint-disable-line react-hooks/exhaustive-deps

  const notifyApiResponse = useCallback((url: string, method: string, data: any) => {
    const s = stateRef.current;
    if (!s.flowStarted || s.currentStepIndex >= DEFAULT_DEMO_FLOW.length) return;

    const step = DEFAULT_DEMO_FLOW[s.currentStepIndex];
    if (!step.completionEvent) return;

    // Auto-capture orderId from order creation
    if (step.id === 'create-order' && data?.id) {
      setState(prev => ({ ...prev, orderId: data.id }));
    }

    if (step.completionEvent.matchResponse(data)) {
      // Auto-advance after a short delay
      setTimeout(() => {
        setState(prev => {
          const nextIndex = prev.currentStepIndex + 1;
          if (nextIndex >= DEFAULT_DEMO_FLOW.length) return prev;

          const nextStep = DEFAULT_DEMO_FLOW[nextIndex];
          // Switch role if needed
          if (nextStep.role !== prev.activeRole) {
            const token = prev.tokens[nextStep.role];
            if (token) {
              if (nextStep.role === 'staff') injectStaffToken(token.accessToken);
              else if (nextStep.role === 'admin') injectAdminToken(token.accessToken);
              else if (nextStep.role === 'customer') injectCustomerToken(token.accessToken);
            }
            const screen = resolveScreenForCapability(nextStep.capability);
            if (screen) {
              router.push(screen.demoRoute);
            }
          }

          return { ...prev, currentStepIndex: nextIndex, activeRole: nextStep.role };
        });
      }, 800);
    }
  }, [router]);

  const switchRole = useCallback((role: 'customer' | 'staff' | 'admin') => {
    const token = stateRef.current.tokens[role];
    if (!token) return;

    if (role === 'staff') injectStaffToken(token.accessToken);
    else if (role === 'admin') injectAdminToken(token.accessToken);
    else if (role === 'customer') injectCustomerToken(token.accessToken);

    setState(prev => ({ ...prev, activeRole: role }));

    // Navigate to the role's screen
    const roleScreenMap: Record<string, string> = {
      staff: '/demo/staff',
      admin: '/demo/admin',
      customer: '/demo/customer',
    };
    router.push(roleScreenMap[role]);
  }, [router]);

  const advanceFlow = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentStepIndex + 1;
      if (nextIndex >= DEFAULT_DEMO_FLOW.length) return prev;

      const nextStep = DEFAULT_DEMO_FLOW[nextIndex];
      if (nextStep.role !== prev.activeRole) {
        const token = prev.tokens[nextStep.role];
        if (token) {
          if (nextStep.role === 'staff') injectStaffToken(token.accessToken);
          else if (nextStep.role === 'admin') injectAdminToken(token.accessToken);
          else if (nextStep.role === 'customer') injectCustomerToken(token.accessToken);
        }
        const screen = resolveScreenForCapability(nextStep.capability);
        if (screen) router.push(screen.demoRoute);
        return { ...prev, currentStepIndex: nextIndex, activeRole: nextStep.role };
      }

      return { ...prev, currentStepIndex: nextIndex };
    });
  }, [router]);

  const goToStep = useCallback((index: number) => {
    if (index < 0 || index >= DEFAULT_DEMO_FLOW.length) return;
    const step = DEFAULT_DEMO_FLOW[index];
    setState(prev => {
      if (step.role !== prev.activeRole) {
        const token = prev.tokens[step.role];
        if (token) {
          if (step.role === 'staff') injectStaffToken(token.accessToken);
          else if (step.role === 'admin') injectAdminToken(token.accessToken);
          else if (step.role === 'customer') injectCustomerToken(token.accessToken);
        }
        const screen = resolveScreenForCapability(step.capability);
        if (screen) router.push(screen.demoRoute);
      }
      return { ...prev, currentStepIndex: index, activeRole: step.role };
    });
  }, [router]);

  const startFlow = useCallback(() => {
    setState(prev => ({ ...prev, flowStarted: true, currentStepIndex: 0 }));
    router.push('/demo/staff');
  }, [router]);

  const resetDemoAction = useCallback(async () => {
    try {
      await resetDemoData();
    } catch (err) {
      console.error('Demo reset failed:', err);
    }
    setState(prev => ({
      ...prev,
      flowStarted: false,
      currentStepIndex: 0,
      orderId: null,
      activeRole: 'staff',
    }));
    router.push('/demo');
  }, [router]);

  const currentStep = state.flowStarted && state.currentStepIndex < DEFAULT_DEMO_FLOW.length
    ? DEFAULT_DEMO_FLOW[state.currentStepIndex]
    : null;

  return (
    <DemoContext.Provider value={{
      ...state,
      switchRole,
      advanceFlow,
      goToStep,
      startFlow,
      resetDemo: resetDemoAction,
      currentStep,
      flow: DEFAULT_DEMO_FLOW,
      notifyApiResponse,
    }}>
      {children}
    </DemoContext.Provider>
  );
}
