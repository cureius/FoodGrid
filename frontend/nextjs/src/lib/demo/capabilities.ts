export interface DemoScreen {
  role: 'staff' | 'admin' | 'customer';
  capabilities: string[];
  demoRoute: string;
}

export const DEMO_SCREENS: Record<string, DemoScreen> = {
  'staff-orders': {
    role: 'staff',
    capabilities: ['view-orders', 'create-order', 'add-items', 'mark-served', 'generate-bill', 'record-payment'],
    demoRoute: '/demo/staff',
  },
  'admin-dashboard': {
    role: 'admin',
    capabilities: ['view-analytics', 'refresh-dashboard'],
    demoRoute: '/demo/admin',
  },
  'customer-menu': {
    role: 'customer',
    capabilities: ['browse-menu', 'add-to-cart'],
    demoRoute: '/demo/customer',
  },
};

export function resolveScreenForCapability(capability: string): DemoScreen | null {
  for (const screen of Object.values(DEMO_SCREENS)) {
    if (screen.capabilities.includes(capability)) return screen;
  }
  return null;
}

export function resolveRouteForCapability(capability: string): string | null {
  const screen = resolveScreenForCapability(capability);
  return screen?.demoRoute ?? null;
}
