'use client';

import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart';
import { useQuery } from '@tanstack/react-query';
import { formatPrice, calculateCartTotal, listOrders, getOrderStatusInfo, getImageUrl, createPaymentLink } from '@/lib/api/customer';
import { motion } from 'framer-motion';
import { ChevronLeft, ArrowRight, Clock, ReceiptText, ChevronRight, Plus, Info } from 'lucide-react';
import QuantityControl from '@/components/user/ui/QuantityControl';
import Image from 'next/image';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, clearCart, subtotal, outletId } = useCartStore();
  
  const { taxAmount, total } = calculateCartTotal(items);

  const { data: orders } = useQuery({
    queryKey: ['active-orders', outletId],
    queryFn: () => listOrders(10, outletId || undefined),
    enabled: !!outletId
  });

  const activeOrders = orders?.filter(o => 
    !['PAID', 'CANCELLED', 'DELIVERED', 'SERVED'].includes(o.status)
  ) || [];

  if (items.length === 0 && activeOrders.length === 0) {
    return (
      <div className="empty-cart-page">
        <div className="empty-cart-image-wrap">
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <circle cx="60" cy="60" r="60" fill="var(--bg-app)" />
            <path 
              d="M40 45H80L75 75H45L40 45Z" 
              stroke="var(--primary)" 
              strokeWidth="2.5" 
              strokeLinejoin="round" 
              opacity="0.8"
            />
            <path 
              d="M50 45V38C50 32.4772 54.4772 28 60 28C65.5228 28 70 32.4772 70 38V45" 
              stroke="var(--primary)" 
              strokeWidth="2.5" 
              opacity="0.8"
            />
            <circle cx="52" cy="82" r="3" fill="var(--primary)" opacity="0.6" />
            <circle cx="68" cy="82" r="3" fill="var(--primary)" opacity="0.6" />
            
            <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                d="M50 55L70 65"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.3"
            />
          </svg>
        </div>
        <h2 className="empty-cart-title">Your cart is empty</h2>
        <p className="empty-cart-text">Good food is always just a few taps away. Explore our menu now!</p>
        <button
          onClick={() => router.push(outletId ? `/user/${outletId}` : '/user/outlets')}
          className="empty-cart-btn"
        >
          Browse Menu
        </button>
        <style jsx>{`
          .empty-cart-page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px; text-align: center; background: var(--bg-surface); }
          .empty-cart-image-wrap { position: relative; width: 256px; height: 256px; margin-bottom: 24px; opacity: 0.2; grayscale: 1; }
          .empty-cart-title { font-size: 24px; font-weight: 800; margin-bottom: 8px; color: var(--text-primary); }
          .empty-cart-text { color: var(--text-muted); margin-bottom: 32px; font-weight: 500; max-width: 240px; }
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
          <h1 className="header-title">My Cart</h1>
          <p className="header-subtitle">{items.length} Items in cart</p>
        </div>
        {items.length > 0 && (
          <button 
            onClick={() => { if(confirm('Clear entire cart?')) clearCart(); }}
            className="clear-btn"
          >
            CLEAR
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="cart-main">
        {/* Active Orders Section */}
        {activeOrders.length > 0 && (
           <section className="active-orders-section card">
              <div className="section-header">
                  <Clock size={16} className="text-primary" />
                  <h2 className="section-title">Orders in Progress</h2>
              </div>
              <div className="active-orders-list">
                 {activeOrders.map(order => {
                    const statusInfo = getOrderStatusInfo(order.status);
                    const isUnpaid = order.status === 'OPEN' || order.status === 'BILLED';
                    
                    return (
                        <div 
                          key={order.id} 
                          className="active-order-card"
                          onClick={() => router.push(`/user/${outletId}/orders/${order.id}`)}
                        >
                           <div className="order-main">
                              <div className="order-meta-info">
                                 <h4 className="order-number">Order #{order.id.slice(-4).toUpperCase()}</h4>
                                 <p className="order-items">{order.items.length} items • {formatPrice(order.grandTotal)}</p>
                              </div>
                              <div className="status-and-pay">
                                 <div className="status-badge" style={{ background: statusInfo.bgColor, color: statusInfo.color }}>
                                    {statusInfo.label}
                                 </div>
                                 {isUnpaid && (
                                     <button 
                                        className="inline-pay-btn"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                                const link = await createPaymentLink(order.id);
                                                if (link.paymentLink) window.open(link.paymentLink, '_blank');
                                            } catch (err) {
                                                alert('Failed to generate payment link');
                                            }
                                        }}
                                     >
                                         PAY NOW
                                     </button>
                                 )}
                              </div>
                           </div>
                           <ChevronRight size={18} className="text-light" />
                        </div>
                    )
                 })}
              </div>
           </section>
        )}

        {items.length > 0 ? (
          <>
            {/* Cart Items */}
            <section className="items-section card">
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
                              Customized <ChevronRight size={10} />
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
                onClick={() => router.push(outletId ? `/user/${outletId}` : '/user/outlets')}
                className="add-more-btn"
              >
                <Plus size={18} />
                Add more items
              </button>
            </section>

            {/* Bill Summary */}
            <section className="bill-section card">
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
                
                <div className="bill-divider" />
                
                <div className="bill-total">
                    <span>To Pay</span>
                    <span>{formatPrice(total)}</span>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="no-items-card card">
              <p>Nothing in cart. Check your active orders above or browse the menu.</p>
              <button 
                onClick={() => router.push(outletId ? `/user/${outletId}` : '/user/outlets')}
                className="browse-mini-btn"
              >
                Browse Menu
              </button>
          </div>
        )}
      </main>

      {/* Bottom Action */}
      {items.length > 0 && (
        <div className="bottom-bar">
          <div 
              className="checkout-btn"
              onClick={() => router.push(`/user/${outletId}/checkout`)}
            >
              <div className="btn-total">
                <span className="total-label">Subtotal</span>
                <span className="total-val">{formatPrice(total)}</span>
              </div>
              <div className="btn-action">
                Checkout
                <ArrowRight size={18} />
              </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .cart-page { background: var(--bg-app); min-height: 100vh; padding-bottom: 120px; }
        .cart-header { position: sticky; top: 0; z-index: 40; background: var(--bg-surface); border-bottom: 1px solid var(--border-light); padding: 0 16px; height: 64px; display: flex; align-items: center; gap: 16px; }
        .back-btn { padding: 4px; margin-left: -4px; color: var(--text-primary); }
        .header-titles { flex: 1; }
        .header-title { font-size: 18px; font-weight: 800; line-height: 1; color: var(--text-primary); }
        .header-subtitle { font-size: 10px; color: var(--text-light); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
        .clear-btn { font-size: 11px; font-weight: 800; color: var(--danger); text-transform: uppercase; letter-spacing: 0.5px; }
        
        .cart-main { display: flex; flex-direction: column; gap: 12px; padding: 12px; max-width: 450px; margin: 0 auto; }
        .card { background: var(--bg-surface); border-radius: 24px; border: 1px solid var(--border-light); box-shadow: var(--shadow-sm); }
        
        .section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 0 4px; }
        .section-title { font-size: 14px; font-weight: 800; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px; }
        
        .active-orders-section { padding: 20px; }
        .active-orders-list { display: flex; flex-direction: column; gap: 12px; }
        .active-order-card { display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--bg-app); border-radius: 16px; cursor: pointer; transition: 0.2s; }
        .active-order-card:active { transform: scale(0.98); }
        .order-main { flex: 1; display: flex; justify-content: space-between; align-items: center; margin-right: 12px; }
        .order-number { font-size: 13px; font-weight: 800; color: var(--text-primary); }
        .order-items { font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px; }
        .order-meta-info { flex: 1; }
        .status-and-pay { display: flex; align-items: center; gap: 8px; }
        .inline-pay-btn { padding: 4px 10px; background: var(--primary); color: white; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; border: none; cursor: pointer; transition: 0.2s; }
        .inline-pay-btn:active { transform: scale(0.95); }
        .status-badge { padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; }

        .items-section { padding: 20px; }
        .items-list { display: flex; flex-direction: column; gap: 24px; }
        .cart-item { display: flex; gap: 12px; }
        .item-img-wrap { flex-shrink: 0; width: 44px; height: 44px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-light); background: var(--bg-muted); }
        .item-img { object-fit: cover; }
        .item-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--text-light); }
        .item-details { flex: 1; min-width: 0; }
        .item-row { display: flex; justify-content: space-between; align-items: flex-start; }
        .item-name { font-size: 14px; font-weight: 800; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 8px; }
        .item-unit-price { font-size: 12px; color: var(--text-muted); font-weight: 600; margin-top: 2px; }
        .item-total-price { font-size: 14px; font-weight: 800; color: var(--text-primary); }
        .item-instructions { font-size: 10px; color: var(--primary); font-style: italic; font-weight: 600; margin-top: 6px; padding: 4px 8px; background: var(--primary-light); border-radius: 4px; display: inline-block; }
        .item-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
        .customize-btn { font-size: 10px; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 4px; opacity: 0.8; }
        
        .add-more-btn { width: 100%; margin-top: 24px; height: 48px; border: 2px dashed var(--border-light); border-radius: 12px; color: var(--primary); font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
        .add-more-btn:hover { background: var(--bg-app); }

        .bill-section { padding: 20px; }
        .bill-header { display: flex; align-items: center; gap: 8px; color: var(--text-light); margin-bottom: 20px; }
        .bill-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); }
        .bill-lines { display: flex; flex-direction: column; gap: 12px; }
        .bill-line { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 600; color: var(--text-muted); }
        .bill-line .dashed { border-bottom: 1px dashed var(--border-light); padding-bottom: 2px; display: flex; align-items: center; gap: 4px; }
        .bill-divider { height: 1px; background: var(--border-light); margin: 8px 0; }
        .bill-total { display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: 800; color: var(--text-primary); }
        
        .no-items-card { padding: 40px 20px; text-align: center; }
        .no-items-card p { font-size: 14px; color: var(--text-muted); margin-bottom: 20px; font-weight: 500; }
        .browse-mini-btn { padding: 10px 24px; background: var(--primary); color: white; border-radius: 10px; font-weight: 800; font-size: 13px; }

        .bottom-bar { position: fixed; bottom: 72px; left: 0; right: 0; z-index: 50; background: var(--bg-surface); padding: 16px; border-top: 1px solid var(--border-light); box-shadow: var(--shadow-lg); padding-bottom: calc(16px + env(safe-area-inset-bottom)); }
        .checkout-btn { max-width: 418px; margin: 0 auto; background: var(--primary); color: white; height: 56px; border-radius: 16px; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 12px 24px rgba(75, 112, 245, 0.25); position: relative; overflow: hidden; transition: 0.2s; }
        .checkout-btn:active { transform: scale(0.98); }
        .btn-total { display: flex; flex-direction: column; gap: 2px; }
        .total-label { font-size: 10px; font-weight: 800; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px; }
        .total-val { font-size: 18px; font-weight: 800; }
        .btn-action { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }

        .empty-cart-page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px; text-align: center; background: var(--bg-surface); }
        .empty-cart-image-wrap { position: relative; width: 256px; height: 256px; margin-bottom: 24px; opacity: 0.2; }
        .empty-cart-title { font-size: 24px; font-weight: 800; margin-bottom: 8px; color: var(--text-primary); }
        .empty-cart-text { color: var(--text-muted); margin-bottom: 32px; font-weight: 500; max-width: 240px; }
        .empty-cart-btn { background: var(--primary); color: white; font-weight: 800; padding: 12px 32px; border-radius: 12px; box-shadow: 0 8px 20px rgba(75, 112, 245, 0.2); }
      `}</style>
    </div>
  );
}
