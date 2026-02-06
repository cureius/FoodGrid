export const DemoAnchors = {
  CUSTOMER: {
    START_ORDER: 'customer.kiosk.start',
    MENU_Category_BURGERS: 'customer.menu.category.burgers',
    ADD_TO_CART: 'customer.menu.item.add',
    VIEW_CART: 'customer.cart.view',
    CHECKOUT: 'customer.checkout.submit',
  },
  KITCHEN: {
    KOT_LIST: 'kitchen.kot.list',
    ACCEPT_ORDER: 'kitchen.kot.accept',
    MARK_READY: 'kitchen.kot.ready',
  },
  STAFF: {
    ORDER_LIST: 'staff.orders.list',
    SERVE_ORDER: 'staff.orders.serve',
  }
} as const;
