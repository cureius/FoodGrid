/**
 * Cart Store using Zustand
 * Manages cart state with localStorage persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MenuItem, SelectedCustomization, SelectedAddon } from '@/lib/api/customer';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface CartItem {
  id: string; // Unique cart item identifier (generated)
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  customizations: SelectedCustomization[];
  addons: SelectedAddon[];
  specialInstructions: string;
  unitPrice: number; // Base price + customizations + addons
  totalPrice: number; // unitPrice * quantity
}

interface CartState {
  // State
  outletId: string | null;
  items: CartItem[];
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableId: string | null;
  
  // Computed values (stored for convenience)
  itemCount: number;
  subtotal: number;
  
  // Actions
  setOutlet: (outletId: string) => void;
  setOrderType: (type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY') => void;
  setTableId: (tableId: string | null) => void;
  
  addItem: (
    menuItem: MenuItem,
    quantity: number,
    customizations?: SelectedCustomization[],
    addons?: SelectedAddon[],
    specialInstructions?: string
  ) => void;
  
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateSpecialInstructions: (cartItemId: string, instructions: string) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  
  // Helpers
  getItemQuantity: (menuItemId: string) => number;
  findExistingItem: (
    menuItemId: string,
    customizations?: SelectedCustomization[],
    addons?: SelectedAddon[]
  ) => CartItem | undefined;
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function generateCartItemId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function calculateItemPrice(
  basePrice: number,
  customizations: SelectedCustomization[],
  addons: SelectedAddon[]
): number {
  const customizationTotal = customizations.reduce((sum, c) => sum + c.price, 0);
  const addonTotal = addons.reduce((sum, a) => sum + (a.price * a.quantity), 0);
  return basePrice + customizationTotal + addonTotal;
}

function recalculateTotals(items: CartItem[]): { itemCount: number; subtotal: number } {
  return {
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.totalPrice, 0),
  };
}

function compareCustomizations(
  a: SelectedCustomization[],
  b: SelectedCustomization[]
): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x.optionId.localeCompare(y.optionId));
  const sortedB = [...b].sort((x, y) => x.optionId.localeCompare(y.optionId));
  return sortedA.every((item, idx) => item.optionId === sortedB[idx].optionId);
}

function compareAddons(a: SelectedAddon[], b: SelectedAddon[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x.addonId.localeCompare(y.addonId));
  const sortedB = [...b].sort((x, y) => x.addonId.localeCompare(y.addonId));
  return sortedA.every(
    (item, idx) =>
      item.addonId === sortedB[idx].addonId && item.quantity === sortedB[idx].quantity
  );
}

// ─────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial State
      outletId: null,
      items: [],
      orderType: 'TAKEAWAY',
      tableId: null,
      itemCount: 0,
      subtotal: 0,

      // Actions
      setOutlet: (outletId) => {
        const currentOutletId = get().outletId;
        // Clear cart if switching outlets
        if (currentOutletId && currentOutletId !== outletId) {
          set({
            outletId,
            items: [],
            itemCount: 0,
            subtotal: 0,
          });
        } else {
          set({ outletId });
        }
      },

      setOrderType: (orderType) => set({ orderType }),
      
      setTableId: (tableId) => set({ tableId }),

      addItem: (menuItem, quantity, customizations = [], addons = [], specialInstructions = '') => {
        const state = get();
        
        // Check if identical item exists (same menu item + customizations + addons)
        const existingItem = state.findExistingItem(menuItem.id, customizations, addons);
        
        if (existingItem && !specialInstructions && !existingItem.specialInstructions) {
          // Update quantity of existing item
          const newQuantity = existingItem.quantity + quantity;
          const unitPrice = calculateItemPrice(menuItem.basePrice, customizations, addons);
          
          const updatedItems = state.items.map((item) =>
            item.id === existingItem.id
              ? { ...item, quantity: newQuantity, totalPrice: unitPrice * newQuantity }
              : item
          );
          
          const totals = recalculateTotals(updatedItems);
          set({ items: updatedItems, ...totals });
        } else {
          // Add as new item
          const unitPrice = calculateItemPrice(menuItem.basePrice, customizations, addons);
          const newItem: CartItem = {
            id: generateCartItemId(),
            menuItemId: menuItem.id,
            menuItem,
            quantity,
            customizations,
            addons,
            specialInstructions,
            unitPrice,
            totalPrice: unitPrice * quantity,
          };
          
          const updatedItems = [...state.items, newItem];
          const totals = recalculateTotals(updatedItems);
          set({ items: updatedItems, ...totals });
        }
      },

      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId);
          return;
        }

        const updatedItems = get().items.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
            : item
        );
        
        const totals = recalculateTotals(updatedItems);
        set({ items: updatedItems, ...totals });
      },

      updateSpecialInstructions: (cartItemId, instructions) => {
        const updatedItems = get().items.map((item) =>
          item.id === cartItemId ? { ...item, specialInstructions: instructions } : item
        );
        set({ items: updatedItems });
      },

      removeItem: (cartItemId) => {
        const updatedItems = get().items.filter((item) => item.id !== cartItemId);
        const totals = recalculateTotals(updatedItems);
        set({ items: updatedItems, ...totals });
      },

      clearCart: () => {
        set({
          items: [],
          itemCount: 0,
          subtotal: 0,
        });
      },

      // Helpers
      getItemQuantity: (menuItemId) => {
        return get().items
          .filter((item) => item.menuItemId === menuItemId)
          .reduce((sum, item) => sum + item.quantity, 0);
      },

      findExistingItem: (menuItemId, customizations = [], addons = []) => {
        return get().items.find(
          (item) =>
            item.menuItemId === menuItemId &&
            compareCustomizations(item.customizations, customizations) &&
            compareAddons(item.addons, addons)
        );
      },
    }),
    {
      name: 'foodgrid-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        outletId: state.outletId,
        items: state.items,
        orderType: state.orderType,
        tableId: state.tableId,
        itemCount: state.itemCount,
        subtotal: state.subtotal,
      }),
    }
  )
);

// ─────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────

export const selectCartItems = (state: CartState) => state.items;
export const selectCartItemCount = (state: CartState) => state.itemCount;
export const selectCartSubtotal = (state: CartState) => state.subtotal;
export const selectOrderType = (state: CartState) => state.orderType;
