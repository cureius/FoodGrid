'use client';

import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart';
import { formatPrice, calculateCartTotal } from '@/lib/api/customer';
import { ChevronLeft, Trash2, ArrowRight, Clock, MapPin, ReceiptText, ChevronRight, Plus, Info } from 'lucide-react';
import QuantityControl from '@/components/user/ui/QuantityControl';
import Image from 'next/image';
import { getImageUrl } from '@/lib/api/customer';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, clearCart, subtotal } = useCartStore();
  
  const { taxAmount, deliveryFee, total } = calculateCartTotal(items);

  if (items.length === 0) {
    return (
      <div className="empty-cart-page">
        <div className="empty-cart-image-wrap">
          <Image src="/res/empty_cart.png" alt="Empty Cart" fill className="empty-img" />
        </div>
        <h2 className="empty-cart-title">Your cart is empty</h2>
        <p className="empty-cart-text">Good food is always just a few taps away. Explore our menu now!</p>
        <button
          onClick={() => router.push('/user')}
          className="empty-cart-btn"
        >
          Browse Menu
        </button>
        <style jsx>{`
          .empty-cart-page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px; text-align: center; }
          .empty-cart-image-wrap { position: relative; width: 256px; height: 256px; margin-bottom: 24px; }
          .empty-cart-title { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
          .empty-cart-text { color: var(--text-muted); margin-bottom: 32px; font-weight: 500; }
          .empty-cart-btn { background: var(--primary); color: white; font-weight: 800; padding: 12px 32px; border-radius: 12px; box-shadow: 0 8px 20px rgba(75, 112, 245, 0.2); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {/* Header */}
      <header className="cart-header">
        <button onClick={() => router.back()} className="back-btn">
          <ChevronLeft size={24} />
        </button>
        <div className="header-titles">
          <h1 className="header-title">Checkout</h1>
          <p className="header-subtitle">{items.length} Items • BURGER HOUSE</p>
        </div>
        <button 
          onClick={() => { if(confirm('Clear entire cart?')) clearCart(); }}
          className="clear-btn"
        >
          CLEAR ALL
        </button>
      </header>

      {/* Main Content */}
      <main className="cart-main">
        {/* Cart Items */}
        <section className="items-section">
          <div className="items-list">
            {items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-img-wrap">
                  {item.menuItem.primaryImageUrl ? (
                      <Image src={getImageUrl(item.menuItem.primaryImageUrl)!} alt={item.menuItem.name} width={48} height={48} className="item-img" />
                  ) : (
                      <div className="item-img-placeholder">IMG</div>
                  )}
                </div>
                <div className="item-details">
                  <div className="item-row">
                    <div className="item-info">
                      <h3 className="item-name">{item.menuItem.name}</h3>
                      <p className="item-unit-price">{formatPrice(item.unitPrice)}</p>
                    </div>
                    <span className="item-total-price">{formatPrice(item.totalPrice)}</span>
                  </div>
                  
                  {item.specialInstructions && (
                    <p className="item-instructions">"{item.specialInstructions}"</p>
                  )}

                  <div className="item-actions">
                       <button className="customize-btn">
                          Add Customization <ChevronRight size={10} />
                       </button>
                       <QuantityControl 
                          quantity={item.quantity}
                          onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                          onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
                          size="sm"
                          showDelete
                      />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
             onClick={() => router.push('/user')}
             className="add-more-btn"
          >
             <Plus size={18} />
             Add more items
          </button>
        </section>

        {/* Delivery Info */}
        <section className="info-block">
          <div className="info-row">
            <div className="info-icon clock">
               <Clock size={20} />
            </div>
            <div className="info-content">
               <h4 className="info-title">Delivery in 25-30 mins</h4>
               <p className="info-subtitle">Arriving via Burger House Fleet</p>
            </div>
          </div>

          <div className="info-row border-top">
            <div className="info-icon map">
               <MapPin size={20} />
            </div>
            <div className="info-content">
               <h4 className="info-title">Delivering to Home</h4>
               <p className="info-subtitle">402, Skyline Residency, Koramangala...</p>
            </div>
            <button className="change-btn">CHANGE</button>
          </div>
        </section>

        {/* Bill Summary */}
        <section className="bill-section">
          <div className="bill-header">
             <ReceiptText size={18} />
             <h4 className="bill-title">Bill Summary</h4>
          </div>
          
          <div className="bill-lines">
             <div className="bill-line">
                <span>Item Total</span>
                <span>{formatPrice(subtotal)}</span>
             </div>
             <div className="bill-line">
                <span className="dashed">Taxes & Charges <Info size={12} /></span>
                <span>{formatPrice(taxAmount)}</span>
             </div>
             <div className="bill-line">
                <span>Delivery Fee</span>
                <span className={deliveryFee === 0 ? 'free' : ''}>
                  {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                </span>
             </div>
             
             <div className="bill-divider" />
             
             <div className="bill-total">
                <span>To Pay</span>
                <span>{formatPrice(total)}</span>
             </div>
          </div>
        </section>

        <p className="cancellation-policy">Review your order carefully before paying. 100% cancellation fee applies once order is accepted by restaurant.</p>
      </main>

      {/* Bottom Action */}
      <div className="bottom-bar">
         <div 
            className="checkout-btn"
            onClick={() => router.push('/user/checkout')}
          >
            <div className="btn-total">
               <span className="total-label">Total to Pay</span>
               <span className="total-val">{formatPrice(total)}</span>
            </div>
            <div className="btn-action">
               Proceed to Pay
               <ArrowRight size={18} />
            </div>
            <div className="btn-shimmer" />
         </div>
      </div>

      <style jsx>{`
        .cart-page { background: var(--bg-app); min-height: 100vh; padding-bottom: 120px; }
        .cart-header { position: sticky; top: 0; z-index: 40; background: white; border-bottom: 1px solid var(--border-light); padding: 0 16px; height: 64px; display: flex; align-items: center; gap: 16px; }
        .back-btn { padding: 4px; margin-left: -4px; color: var(--text-main); }
        .header-titles { flex: 1; }
        .header-title { font-size: 18px; font-weight: 800; line-height: 1; }
        .header-subtitle { font-size: 10px; color: var(--text-light); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
        .clear-btn { font-size: 12px; font-weight: 800; color: var(--danger); }
        
        .cart-main { display: flex; flex-direction: column; gap: 12px; }
        .items-section { background: white; padding: 16px; border-bottom: 1px solid var(--border-light); }
        .items-list { display: flex; flex-direction: column; gap: 24px; }
        .cart-item { display: flex; gap: 12px; }
        .item-img-wrap { flex-shrink: 0; width: 48px; height: 48px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-light); }
        .item-img { object-fit: cover; }
        .item-img-placeholder { width: 100%; height: 100%; background: var(--bg-muted); display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--text-light); }
        .item-details { flex: 1; min-width: 0; }
        .item-row { display: flex; justify-content: space-between; align-items: flex-start; }
        .item-name { font-size: 14px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 8px; }
        .item-unit-price { font-size: 12px; color: var(--text-muted); font-weight: 600; margin-top: 2px; }
        .item-total-price { font-size: 14px; font-weight: 800; color: var(--navy); }
        .item-instructions { font-size: 10px; color: var(--secondary); font-style: italic; font-weight: 600; margin-top: 4px; }
        .item-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
        .customize-btn { font-size: 10px; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 4px; opacity: 0.8; }
        .customize-btn:hover { opacity: 1; }
        
        .add-more-btn { width: 100%; margin-top: 24px; height: 48px; border: 2px dashed rgba(75, 112, 245, 0.2); border-radius: 12px; color: var(--primary); font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .add-more-btn:hover { background: rgba(75, 112, 245, 0.05); }

        .info-block { background: white; padding: 24px 16px; border-bottom: 1px solid var(--border-light); display: flex; flex-direction: column; gap: 16px; }
        .info-row { display: flex; align-items: center; gap: 16px; }
        .info-row.border-top { padding-top: 16px; border-top: 1px solid var(--border-light); }
        .info-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .info-icon.clock { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .info-icon.map { background: rgba(75, 112, 245, 0.1); color: var(--primary); }
        .info-content { flex: 1; overflow: hidden; }
        .info-title { font-size: 14px; font-weight: 800; }
        .info-subtitle { font-size: 12px; color: var(--text-muted); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
        .change-btn { font-size: 12px; font-weight: 800; color: var(--primary); padding: 4px; }

        .bill-section { background: white; padding: 24px 16px; border-bottom: 1px solid var(--border-light); }
        .bill-header { display: flex; align-items: center; gap: 8px; color: var(--text-light); margin-bottom: 16px; }
        .bill-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); }
        .bill-lines { display: flex; flex-direction: column; gap: 12px; }
        .bill-line { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 600; color: var(--text-muted); }
        .bill-line .dashed { border-bottom: 1px dashed rgba(0,0,0,0.1); padding-bottom: 2px; display: flex; align-items: center; gap: 4px; }
        .bill-line span.free { color: var(--success); }
        .bill-divider { height: 1px; background: var(--border-light); margin: 8px 0; }
        .bill-total { display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: 800; color: var(--navy); }
        
        .cancellation-policy { padding: 16px 24px; text-align: center; font-size: 10px; color: var(--text-light); font-weight: 600; line-height: 1.5; }

        .bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; background: white; padding: 16px; border-top: 1px solid var(--border-light); box-shadow: 0 -10px 40px rgba(0,0,0,0.08); padding-bottom: calc(16px + env(safe-area-inset-bottom)); }
        .checkout-btn { max-width: 418px; margin: 0 auto; background: var(--primary); color: white; height: 56px; border-radius: 12px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 8px 24px rgba(75, 112, 245, 0.3); position: relative; overflow: hidden; cursor: pointer; transition: var(--transition-fast); }
        .checkout-btn:active { transform: scale(0.98); }
        .btn-total { display: flex; flex-direction: column; gap: 2px; }
        .total-label { font-size: 10px; font-weight: 700; opacity: 0.8; text-transform: uppercase; }
        .total-val { font-size: 18px; font-weight: 800; }
        .btn-action { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
        .btn-shimmer { position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); transform: translateX(-100%); animation: shimmerMove 2s infinite; }
        @keyframes shimmerMove { 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}
