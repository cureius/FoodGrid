export interface DemoFlowStep {
  id: string;
  role: 'customer' | 'staff' | 'admin';
  capability: string;
  targetAction: string;
  title: string;
  description: string;
  completionEvent: {
    matchResponse: (data: any) => boolean;
  } | null;
}

export const DEFAULT_DEMO_FLOW: DemoFlowStep[] = [
  {
    id: 'welcome',
    role: 'staff',
    capability: 'view-orders',
    targetAction: '',
    title: 'Welcome to FoodGrid',
    description: "This is the POS dashboard where staff manage orders. Let's create a new order.",
    completionEvent: null,
  },
  {
    id: 'create-order',
    role: 'staff',
    capability: 'create-order',
    targetAction: 'create-order',
    title: 'Create a New Order',
    description: 'Click the "Create New Order" button to start a dine-in order.',
    completionEvent: {
      matchResponse: (data: any) => data?.id && data?.status === 'OPEN',
    },
  },
  {
    id: 'add-items',
    role: 'staff',
    capability: 'add-items',
    targetAction: 'add-to-cart',
    title: 'Add Items to Order',
    description: 'Select menu items to add to the order.',
    completionEvent: {
      matchResponse: (data: any) => data?.items?.length > 0,
    },
  },
  {
    id: 'mark-served',
    role: 'staff',
    capability: 'mark-served',
    targetAction: 'mark-served',
    title: 'Mark Order as Served',
    description: 'The kitchen has prepared the food. Mark the order as served.',
    completionEvent: {
      matchResponse: (data: any) => data?.status === 'SERVED',
    },
  },
  {
    id: 'generate-bill',
    role: 'staff',
    capability: 'generate-bill',
    targetAction: 'generate-bill',
    title: 'Generate Bill',
    description: 'Generate the bill for this completed order.',
    completionEvent: {
      matchResponse: (data: any) => data?.status === 'BILLED',
    },
  },
  {
    id: 'record-payment',
    role: 'staff',
    capability: 'record-payment',
    targetAction: 'record-payment',
    title: 'Record Payment',
    description: 'Record a cash payment to close the order.',
    completionEvent: {
      matchResponse: (data: any) => data?.status === 'COMPLETED' || data?.status === 'PAID',
    },
  },
  {
    id: 'switch-to-admin',
    role: 'admin',
    capability: 'view-analytics',
    targetAction: 'refresh-dashboard',
    title: 'Admin Dashboard',
    description: 'Switch to the admin view. The completed order now appears in the analytics.',
    completionEvent: null,
  },
  {
    id: 'demo-complete',
    role: 'admin',
    capability: 'view-analytics',
    targetAction: '',
    title: 'Demo Complete!',
    description: "You've experienced a complete FoodGrid order flow. Explore more or sign up for a free trial.",
    completionEvent: null,
  },
];
