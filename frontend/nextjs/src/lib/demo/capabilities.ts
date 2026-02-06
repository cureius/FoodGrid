export type Capability = 
  | 'browse_menu' 
  | 'add_to_cart' 
  | 'place_order' 
  | 'manage_orders' 
  | 'send_kot' 
  | 'mark_served' 
  | 'view_kot' 
  | 'mark_item_ready' 
  | 'view_analytics'
  | 'bill_order';

export const screenCapabilities: Record<string, Capability[]> = {
  '/demo/customer/menu': ['browse_menu', 'add_to_cart'],
  '/demo/customer/cart': ['add_to_cart', 'place_order'],
  '/demo/staff/orders': ['manage_orders', 'send_kot', 'mark_served', 'bill_order'],
  '/demo/kitchen/queue': ['view_kot', 'mark_item_ready'],
  '/demo/admin/dashboard': ['view_analytics'],
};

export function getRouteForCapability(cap: Capability): string | null {
  for (const [route, caps] of Object.entries(screenCapabilities)) {
    if (caps.includes(cap)) return route;
  }
  return null;
}
