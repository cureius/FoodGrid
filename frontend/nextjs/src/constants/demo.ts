export const DEMO_CONFIG = {
  OUTLET_ID: 'demo-outlet-1',
  CLIENT_ID: 'demo-client-1',
  CUSTOMER_ID: 'demo-customer-1',
  EMPLOYEES: {
    CASHIER: 'demo-emp-cashier',
    KITCHEN: 'demo-emp-kitchen',
    MANAGER: 'demo-emp-manager',
  },
} as const;

export type DemoRole = 'customer' | 'kitchen' | 'staff' | 'cashier' | 'admin';

export type DemoHint = {
  anchor: string;
  title: string;
  description?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
};

export type DemoFlowStep = {
  id: string;
  role: DemoRole;
  title: string;
  triggerEvent: any;
  completionEvent: any;
  hints: DemoHint[];
  autoAdvance?: boolean;
};
