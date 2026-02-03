'use client';

import { useQuery } from '@tanstack/react-query';
import { listOrders, formatPrice, getOrderStatusInfo, createPaymentLink } from '@/lib/api/customer';
import { useCartStore } from '@/stores/cart';
import { ChevronLeft, ChevronRight, ShoppingBag, Receipt, ArrowRight } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCustomer } from '@/contexts/CustomerContext';
export default function OrdersHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const outletId = params?.outletId as string;
  const { user } = useCustomer();


  
  const { data: orders, isLoading, isError, error } = useQuery({
    queryKey: ['orders-history', outletId],
    queryFn: () => listOrders(20, outletId || undefined, user?.id || undefined), 
    enabled: true 
  });

  if (isLoading) {
    return (
        <div className="history-loading">
            <div className="skeleton-title" />
            {[1,2,3].map(i => (
                <div key={i} className="skeleton-order" />
            ))}
            <style jsx>{`
                .history-loading { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
                .skeleton-title { height: 32px; width: 50%; background: var(--bg-muted); border-radius: 8px; margin-bottom: 24px; animation: pulse 1.5s infinite; }
                .skeleton-order { height: 160px; background: var(--bg-muted); border-radius: 32px; animation: pulse 1.5s infinite; }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
            `}</style>
        </div>
    )
  }

  if (isError) {
      return (
          <div className="error-container">
              <h2>Something went wrong</h2>
              <p>Failed to load orders. Please try again.</p>
              <pre style={{ fontSize: 10, color: 'red', marginTop: 10 }}>
                  {JSON.stringify(error, null, 2)}
              </pre>
              <button onClick={() => window.location.reload()} className="retry-btn">Retry</button>
              <style jsx>{`
                  .error-container { padding: 40px; text-align: center; }
                  .retry-btn { margin-top: 20px; padding: 10px 20px; background: var(--primary); color: white; border-radius: 8px; font-weight: 800; }
              `}</style>
          </div>
      );
  }

  return (
    <div className="orders-history-page">
      <div style={{ display: 'none' }}>DEBUG: Page Rendered. OutletID: {outletId}</div>
      <header className="history-header">
        <button onClick={() => router.push(`/user/${outletId}`)} className="back-btn">
          <ChevronLeft size={24} />
        </button>
        <h1 className="header-title">Your Orders</h1>
      </header>

      <main className="history-main">
        {orders && orders.length > 0 ? (
            <div className="orders-groups">
                <div className="group-header">Recent Orders</div>
                {orders.map((order) => {
                    if (!order || !order.status) return null;
                    const statusInfo = getOrderStatusInfo(order.status as any);
                    const formattedDate = new Date(order.createdAt).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                    });
                    const formattedTime = new Date(order.createdAt).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    return (
                        <div 
                            key={order.id}
                            onClick={() => router.push(`/user/${outletId}/orders/${order.id}`)}
                            className="order-item-card"
                        >
                            <div className="order-item-top">
                                <div className="item-main-info">
                                    <div className="store-icon">
                                        <ShoppingBag size={22} strokeWidth={2.5} />
                                    </div>
                                    <div className="store-details">
                                        <h3 className="store-name">{order.outletName || 'FoodGrid Restaurant'}</h3>
                                        <div className="order-type-tag">
                                            {order.orderType === 'DELIVERY' ? 'Home Delivery' : (order.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Dine-in')}
                                        </div>
                                        <p className="order-items-summary">
                                            {order.items.map(i => `${i.qty}x ${i.itemName}`).join(', ')}
                                        </p>
                                        <div className="order-meta">
                                            <span className="date">{formattedDate} • {formattedTime}</span>
                                            <div className="dot-sep" />
                                            <span className="order-price">{formatPrice(order.grandTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div 
                                    className="status-badge"
                                    style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
                                >
                                    {statusInfo.label}
                                </div>
                            </div>

                            <div className="order-card-footer">
                                <span className="order-id-tag">#{order.id.slice(-6).toUpperCase()}</span>
                                <div className="footer-btns">
                                    {(order.status === 'OPEN' || order.status === 'BILLED' || order.status === 'PLACED') && (
                                        <button 
                                            className="history-pay-btn"
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
                                    <button className="view-link">
                                        TRACK
                                        <ChevronRight size={14} strokeWidth={4} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="empty-history">
                <div className="empty-icon-wrap">
                    <Receipt size={36} />
                </div>
                <h2 className="empty-title">No orders yet</h2>
                <p className="empty-text">You haven't placed any orders yet. Try something delicious today!</p>
                <button 
                  onClick={() => router.push(`/user/${outletId}`)}
                  className="start-btn"
                >
                    Order Now
                    <ArrowRight size={20} />
                </button>
            </div>
        )}
      </main>

      <style jsx>{`
        .orders-history-page { background: var(--bg-app); min-height: 100vh; padding-bottom: 96px; }
        .history-header { position: sticky; top: 0; z-index: 40; background: var(--bg-surface); border-bottom: 1px solid var(--border-light); height: 64px; display: flex; align-items: center; padding: 0 16px; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        .back-btn { padding: 8px; margin-left: -8px; color: var(--text-main); border-radius: 50%; }
        .back-btn:active { background: var(--bg-muted); }
        .header-title { font-size: 18px; font-weight: 800; color: var(--text-main); letter-spacing: -0.5px; }

        .history-main { padding: 16px; max-width: 450px; margin: 0 auto; }
        .group-header { font-size: 11px; font-weight: 900; color: var(--text-light); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px; padding-left: 4px; }
        
        .orders-groups { display: flex; flex-direction: column; gap: 12px; }
        .order-item-card { background: var(--bg-surface); border-radius: 28px; padding: 20px; border: 1px solid var(--border-light); box-shadow: 0 4px 12px rgba(0,0,0,0.03); cursor: pointer; transition: 0.2s; }
        .order-item-card:active { transform: scale(0.98); border-color: var(--primary-border); }
        
        .order-item-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .item-main-info { display: flex; gap: 16px; flex: 1; min-width: 0; }
        .store-icon { width: 44px; height: 44px; border-radius: 12px; background: var(--primary-light); display: flex; align-items: center; justify-content: center; color: var(--primary); flex-shrink: 0; }
        .store-details { flex: 1; min-width: 0; }
        .store-name { font-size: 15px; font-weight: 800; color: var(--text-main); margin-bottom: 2px; }
        .order-type-tag { font-size: 10px; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; margin-bottom: 4px; }
        .order-items-summary { font-size: 12px; color: var(--text-muted); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .order-meta { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; color: var(--text-light); margin-top: 4px; }
        .dot-sep { width: 3px; height: 3px; background: var(--border-light); border-radius: 50%; }
        .order-price { color: var(--text-main); font-weight: 800; }

        .status-badge { flex-shrink: 0; padding: 4px 10px; border-radius: 8px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .order-card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 16px; border-top: 1px solid var(--bg-muted); }
        .order-id-tag { font-size: 10px; font-weight: 800; color: var(--text-light); opacity: 0.6; }
        .footer-btns { display: flex; gap: 12px; align-items: center; }
        .history-pay-btn { padding: 4px 12px; background: var(--primary); color: white; border-radius: 6px; font-size: 10px; font-weight: 800; border: none; cursor: pointer; }
        .view-link { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; }

        .empty-history { padding: 80px 32px; text-align: center; display: flex; flex-direction: column; align-items: center; }
        .empty-icon-wrap { width: 80px; height: 80px; background: var(--bg-surface); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-light); margin-bottom: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.05); }
        .empty-title { font-size: 22px; font-weight: 800; color: var(--text-main); margin-bottom: 12px; }
        .empty-text { font-size: 14px; color: var(--text-muted); font-weight: 500; line-height: 1.6; margin-bottom: 32px; max-width: 240px; }
        .start-btn { height: 56px; padding: 0 40px; background: var(--primary); color: white; border-radius: 16px; font-weight: 800; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 12px; box-shadow: 0 12px 24px rgba(75, 112, 245, 0.2); transition: 0.2s; }
        .start-btn:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
}
