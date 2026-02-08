import { DemoFlowStep, DemoRole, DemoHint } from './demo';
import { DemoAnchors } from '@/lib/demo/anchors';

export const DEMO_FLOWS: Record<string, DemoFlowStep[]> = {
  'customer-order': [
    {
      id: 'step-1-start',
      role: 'customer',
      title: 'Start Ordering',
      triggerEvent: 'DEMO_START',
      completionEvent: 'ORDER_STARTED',
      hints: [
        {
          anchor: DemoAnchors.CUSTOMER.START_ORDER,
          title: 'Start Here',
          description: 'Tap to begin your order on this virtual kiosk.',
          position: 'bottom'
        }
      ]
    },
    {
      id: 'step-2-add-item',
      role: 'customer',
      title: 'Select Item',
      triggerEvent: 'ORDER_STARTED',
      completionEvent: 'ITEM_ADDED',
      hints: [
        {
          anchor: DemoAnchors.CUSTOMER.MENU_Category_BURGERS,
          title: 'Choose a Category',
          description: 'Explore our Burger selection.',
          position: 'right'
        }
      ]
    }
  ]
};
