'use client';

import { useQuery } from '@tanstack/react-query';
import { listOrders, formatPrice, getOrderStatusInfo } from '@/lib/api/customer';
import { useCartStore } from '@/stores/cart';
import { ChevronLeft, ChevronRight, ShoppingBag, Receipt, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCustomer } from '@/contexts/CustomerContext';
export default function OrdersHistoryPage() {
  const router = useRouter();
  const { outletId } = useCartStore();
  const { user } = useCustomer();
  console.log("🚀 ~ OrdersHistoryPage ~ user:", user)

  
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders-history', outletId],
    queryFn: () => listOrders(20, outletId || undefined, user?.id || undefined), 
    enabled: true // Fetch all if no outlet selected, or filter if selected
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

  return (
    <div className="orders-history-page">
      <header className="history-header">
        <button onClick={() => router.push('/user')} className="back-btn">
          <ChevronLeft size={24} />
        </button>
        <h1 className="header-title">Your Orders</h1>
      </header>

      <main className="history-main">
        {orders && orders.length > 0 ? (
            <div className="orders-groups">
                <div className="group-header">Recent Orders</div>
                {orders.map((order) => {
                    const statusInfo = getOrderStatusInfo(order.status as any);
                    return (
                        <div 
                            key={order.id}
                            onClick={() => router.push(`/user/orders/${order.id}`)}
                            className="order-item-card"
                        >
                            <div className="order-item-top">
                                <div className="item-main-info">
                                    <div className="store-icon">
                                        <ShoppingBag size={24} />
                                    </div>
                                    <div className="store-details">
                                        <h3 className="store-name">Burger House</h3>
                                        <p className="order-items-summary">
                                            {order.items.map(i => i.itemName).join(', ')}
                                        </p>
                                        <div className="order-meta">
                                            <span>{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
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
                                    <button className="view-link">
                                        Details
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
                  onClick={() => router.push('/user')}
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
        .history-header { position: sticky; top: 0; z-index: 40; background: white; border-bottom: 1px solid var(--border-light); height: 64px; display: flex; align-items: center; padding: 0 16px; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        .back-btn { padding: 8px; margin-left: -8px; color: var(--navy); border-radius: 50%; }
        .back-btn:active { background: var(--bg-muted); }
        .header-title { font-size: 18px; font-weight: 800; color: var(--navy); letter-spacing: -0.5px; }

        .history-main { padding: 16px; max-width: 450px; margin: 0 auto; }
        .group-header { font-size: 11px; font-weight: 900; color: var(--text-light); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px; padding-left: 4px; }
        
        .orders-groups { display: flex; flex-direction: column; gap: 12px; }
        .order-item-card { background: white; border-radius: 28px; padding: 20px; border: 1px solid var(--border-light); box-shadow: 0 4px 12px rgba(0,0,0,0.03); cursor: pointer; transition: 0.2s; }
        .order-item-card:active { transform: scale(0.98); border-color: var(--primary-border); }
        
        .order-item-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .item-main-info { display: flex; gap: 16px; flex: 1; min-width: 0; }
        .store-icon { width: 44px; height: 44px; border-radius: 12px; background: #EEF2FE; display: flex; align-items: center; justify-content: center; color: #4B70F5; flex-shrink: 0; }
        .store-details { flex: 1; min-width: 0; }
        .store-name { font-size: 15px; font-weight: 800; color: var(--navy); margin-bottom: 2px; }
        .order-items-summary { font-size: 12px; color: var(--text-muted); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .order-meta { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; color: var(--text-light); margin-top: 4px; }
        .dot-sep { width: 3px; height: 3px; background: var(--border-light); border-radius: 50%; }
        .order-price { color: var(--navy); font-weight: 800; }

        .status-badge { flex-shrink: 0; padding: 4px 10px; border-radius: 8px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .order-card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 16px; border-top: 1px solid var(--bg-muted); }
        .order-id-tag { font-size: 10px; font-weight: 800; color: var(--text-light); opacity: 0.6; }
        .footer-btns { display: flex; gap: 12px; }
        .view-link { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; }

        .empty-history { padding: 80px 32px; text-align: center; display: flex; flex-direction: column; align-items: center; }
        .empty-icon-wrap { width: 80px; height: 80px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-light); margin-bottom: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.05); }
        .empty-title { font-size: 22px; font-weight: 800; color: var(--navy); margin-bottom: 12px; }
        .empty-text { font-size: 14px; color: var(--text-muted); font-weight: 500; line-height: 1.6; margin-bottom: 32px; max-width: 240px; }
        .start-btn { height: 56px; padding: 0 40px; background: var(--primary); color: white; border-radius: 16px; font-weight: 800; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 12px; box-shadow: 0 12px 24px rgba(75, 112, 245, 0.2); transition: 0.2s; }
        .start-btn:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
}
