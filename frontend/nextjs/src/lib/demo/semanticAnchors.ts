export const DEMO_ANCHORS = {
  // Customer UI
  MENU_GRID: 'menu-grid',
  ADD_TO_CART_BUTTON: 'add-to-cart',
  CART_BUTTON: 'cart-button',
  CHECKOUT_BUTTON: 'checkout-button',
  PLACE_ORDER_BUTTON: 'place-order',

  // Staff UI
  ORDER_LIST: 'order-list',
  ORDER_CARD: 'order-card',
  SEND_KOT_BUTTON: 'send-kot',
  MARK_SERVED_BUTTON: 'mark-served',
  BILL_ORDER_BUTTON: 'bill-order',

  // Kitchen UI
  KOT_QUEUE: 'kot-queue',
  MARK_READY_BUTTON: 'mark-ready',

  // Admin UI
  DASHBOARD_METRICS: 'dashboard-metrics',
} as const;

export type DemoAnchor = typeof DEMO_ANCHORS[keyof typeof DEMO_ANCHORS];
