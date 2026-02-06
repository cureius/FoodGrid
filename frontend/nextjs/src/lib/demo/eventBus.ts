export type DemoEvent =
  | { type: 'DEMO_START' }
  | { type: 'CART_ITEM_ADDED'; data: { itemId: string } }
  | { type: 'ORDER_CREATED'; data: { orderId: string; status: string } }
  | { type: 'ORDER_STATUS_CHANGED'; data: { orderId: string; status: string } }
  | { type: 'PAYMENT_COMPLETED'; data: { orderId: string } };

type Handler = (event: DemoEvent) => void;

class DemoEventBus {
  private listeners: Map<string, Handler[]> = new Map();

  subscribe(eventType: DemoEvent['type'] | '*', callback: Handler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)?.push(callback);
    
    return () => {
      const handlers = this.listeners.get(eventType);
      if (handlers) {
        this.listeners.set(eventType, handlers.filter(h => h !== callback));
      }
    };
  }

  emit(event: DemoEvent) {
    // Notify specific type listeners
    this.listeners.get(event.type)?.forEach(handler => handler(event));
    // Notify catch-all listeners
    this.listeners.get('*')?.forEach(handler => handler(event));
  }
}

export const demoEventBus = new DemoEventBus();
