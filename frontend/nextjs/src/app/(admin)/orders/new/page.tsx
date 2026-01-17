"use client";

import React, { useState } from 'react';
import styles from './NewOrder.module.css';
import Card from '@/components/ui/Card';
import { 
  Users, 
  ChevronRight, 
  Map, 
  Menu as MenuIcon, 
  Check,
  Plus,
  Minus,
  Search,
  ShoppingCart,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

const CATEGORIES = ['Chef Recommendation', 'Appetizers', 'Main Course', 'Desserts', 'Drinks'];

const MENU_ITEMS = [
  { id: 1, name: 'Tender Stem Broccoli', price: 12.50, category: 'Chef Recommendation', image: '🥦' },
  { id: 2, name: 'Banana Wrap with Honey', price: 8.00, category: 'Desserts', image: '🍌' },
  { id: 3, name: 'Chicken Parmesan', price: 18.20, category: 'Main Course', image: '🍗' },
  { id: 4, name: 'Mango Smoothie', price: 6.50, category: 'Drinks', image: '🥭' },
  { id: 5, name: 'Grilled Salmon', price: 21.00, category: 'Chef Recommendation', image: '🐟' },
  { id: 6, name: 'Caesar Salad', price: 10.50, category: 'Appetizers', image: '🥗' },
];

const NewOrderPage = () => {
  const [step, setStep] = useState(1);
  const [orderInfo, setOrderInfo] = useState({ people: 2, name: '', babyChair: false });
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [cart, setCart] = useState<{item: any, qty: number}[]>([]);
  const [activeCategory, setActiveCategory] = useState('Chef Recommendation');

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(i => i.item.id !== itemId));
  };

  const updateQty = (itemId: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.item.id === itemId) {
        const newQty = Math.max(1, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }));
  };

  const total = cart.reduce((sum, i) => sum + i.item.price * i.qty, 0);

  return (
    <div className={styles.container}>
      <div className={styles.stepper}>
        {[1, 2, 3].map(s => (
          <div key={s} className={cn(styles.step, step >= s && styles.stepActive)}>
            <div className={styles.stepCircle}>{step > s ? <Check size={16} /> : s}</div>
            <span className={styles.stepLabel}>{s === 1 ? 'Customer' : s === 2 ? 'Table' : 'Menu'}</span>
            {s < 3 && <div className={styles.stepDivider} />}
          </div>
        ))}
      </div>

      <div className={styles.content}>
        {step === 1 && (
          <div className={styles.stepContent}>
            <Card className={styles.formCard}>
              <h3>Order Information</h3>
              <div className={styles.formGroup}>
                <label>Number of People</label>
                <div className={styles.numberInput}>
                  <button onClick={() => setOrderInfo({...orderInfo, people: Math.max(1, orderInfo.people - 1)})}><Minus size={20} /></button>
                  <span>{orderInfo.people}</span>
                  <button onClick={() => setOrderInfo({...orderInfo, people: orderInfo.people + 1})}><Plus size={20} /></button>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Customer Name (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. John Doe" 
                  value={orderInfo.name}
                  onChange={(e) => setOrderInfo({...orderInfo, name: e.target.value})}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={orderInfo.babyChair}
                    onChange={(e) => setOrderInfo({...orderInfo, babyChair: e.target.checked})}
                  />
                  <span>Need Baby Chair?</span>
                </label>
              </div>
              <button className={styles.nextBtn} onClick={() => setStep(2)}>
                Choose Table <ChevronRight size={20} />
              </button>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className={styles.stepContent}>
            <h3>Choose a Table</h3>
            <div className={styles.tableMap}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(t => (
                <div 
                  key={t}
                  className={cn(
                    styles.tableNode, 
                    selectedTable === t && styles.tableSelected,
                    t % 5 === 0 && styles.tableOccupied
                  )}
                  onClick={() => t % 5 !== 0 && setSelectedTable(t)}
                >
                  T-{t}
                </div>
              ))}
            </div>
            <div className={styles.footerActions}>
              <button className={styles.backBtn} onClick={() => setStep(1)}>Back</button>
              <button 
                className={styles.nextBtn} 
                disabled={!selectedTable}
                onClick={() => setStep(3)}
              >
                Go to Menu <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.menuLayout}>
            <div className={styles.menuColumn}>
              <div className={styles.menuHeader}>
                <div className={styles.searchBar}>
                  <Search size={20} />
                  <input type="text" placeholder="Search menu items..." />
                </div>
                <div className={styles.categories}>
                  {CATEGORIES.map(c => (
                    <button 
                      key={c}
                      className={cn(styles.catBtn, activeCategory === c && styles.catActive)}
                      onClick={() => setActiveCategory(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.menuGrid}>
                {MENU_ITEMS.filter(i => activeCategory === 'Chef Recommendation' || i.category === activeCategory).map(item => (
                  <Card key={item.id} className={styles.menuItemCard} onClick={() => addToCart(item)}>
                    <div className={styles.itemEmoji}>{item.image}</div>
                    <div className={styles.itemInfo}>
                      <h4>{item.name}</h4>
                      <p className={styles.itemPrice}>${item.price.toFixed(2)}</p>
                    </div>
                    <button className={styles.addBtn}><Plus size={18} /></button>
                  </Card>
                ))}
              </div>
            </div>

            <div className={styles.cartColumn}>
              <Card className={styles.cartCard}>
                <h3>Current Order</h3>
                <div className={styles.cartSummary}>
                  <Badge variant="info">Table T-{selectedTable}</Badge>
                  <p>{orderInfo.people} People</p>
                </div>

                <div className={styles.cartList}>
                  {cart.length === 0 ? (
                    <div className={styles.emptyCart}>
                      <ShoppingCart size={48} />
                      <p>Your cart is empty</p>
                    </div>
                  ) : (
                    cart.map(({item, qty}) => (
                      <div key={item.id} className={styles.cartItem}>
                        <div className={styles.cartItemInfo}>
                          <p className={styles.cartItemName}>{item.name}</p>
                          <p className={styles.cartItemPrice}>${(item.price * qty).toFixed(2)}</p>
                        </div>
                        <div className={styles.qtyCtrl}>
                          <button onClick={() => updateQty(item.id, -1)}><Minus size={14} /></button>
                          <span>{qty}</span>
                          <button onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button>
                          <button className={styles.removeBtn} onClick={() => removeFromCart(item.id)}><X size={14} /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className={styles.cartFooter}>
                  <div className={styles.totalRow}>
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className={styles.totalRow}>
                    <span>Tax (5%)</span>
                    <span>${(total * 0.05).toFixed(2)}</span>
                  </div>
                  <div className={cn(styles.totalRow, styles.grandTotal)}>
                    <span>Total</span>
                    <span>${(total * 1.05).toFixed(2)}</span>
                  </div>
                  <button className={styles.placeOrderBtn} disabled={cart.length === 0}>
                    Place Order
                  </button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewOrderPage;
