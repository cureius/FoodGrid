'use client';

import { useQuery } from '@tanstack/react-query';
import { listOrders, formatPrice, getOrderStatusInfo } from '@/lib/api/customer';
import { useCartStore } from '@/stores/cart';
import { ChevronLeft, ChevronRight, ShoppingBag, Receipt, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OrdersHistoryPage() {
  const router = useRouter();
  const { outletId } = useCartStore();
  
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders-history', outletId],
    queryFn: () => listOrders(20, outletId || undefined), 
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
            orders.map((order) => {
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
                                        <span>{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                        <div className="dot-sep" />
                                        <span className="order-price">{formatPrice(order.grandTotal)}</span>
                                    </div>
                                </div>
                            </div>
                            <div 
                                className="status-badge"
                                style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color, borderColor: statusInfo.color + '40' }}
                            >
                                {statusInfo.label}
                            </div>
                        </div>

                        <div className="card-divider" />

                        <div className="order-card-footer">
                             <button className="view-link">
                                View Details
                                <ChevronRight size={14} strokeWidth={4} />
                             </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); }}
                                className="reorder-btn"
                             >
                                REORDER
                             </button>
                        </div>
                    </div>
                );
            })
        ) : (
            <div className="empty-history">
                <div className="empty-icon-wrap">
                    <Receipt size={36} />
                </div>
                <h2 className="empty-title">No orders yet</h2>
                <p className="empty-text">You haven't placed any orders yet. Delicious food is just a click away!</p>
                <button 
                  onClick={() => router.push('/user')}
                  className="start-btn"
                >
                    Start Ordering
                    <ArrowRight size={20} />
                </button>
            </div>
        )}
      </main>

      <style jsx>{`
        .orders-history-page { background: var(--bg-app); min-height: 100vh; padding-bottom: 96px; }
        .history-header { position: sticky; top: 0; z-index: 40; background: white; border-bottom: 1px solid var(--border-light); height: 64px; display: flex; align-items: center; padding: 0 16px; gap: 16px; }
        .back-btn { padding: 4px; margin-left: -4px; color: var(--navy); }
        .header-title { font-size: 18px; font-weight: 800; color: var(--navy); text-transform: uppercase; letter-spacing: 0.5px; }

        .history-main { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
        
        .order-item-card { background: white; border-radius: 32px; padding: 20px; border: 1px solid var(--border-light); box-shadow: var(--shadow-sm); cursor: pointer; transition: var(--transition-fast); }
        .order-item-card:active { transform: scale(0.98); }
        
        .order-item-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .item-main-info { display: flex; gap: 16px; flex: 1; min-width: 0; }
        .store-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--primary-light); border: 1px solid var(--primary-border); display: flex; align-items: center; justify-content: center; color: var(--primary); flex-shrink: 0; }
        .store-details { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .store-name { font-size: 15px; font-weight: 800; color: var(--navy); }
        .order-items-summary { font-size: 11px; color: var(--text-light); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; letter-spacing: 0.5px; }
        .order-meta { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 800; color: var(--text-muted); margin-top: 4px; }
        .dot-sep { width: 4px; height: 4px; background: var(--border-light); border-radius: 50%; }
        .order-price { color: var(--navy); }

        .status-badge { flex-shrink: 0; padding: 4px 10px; border-radius: 8px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid transparent; }
        
        .card-divider { height: 1px; background: var(--bg-muted); margin-bottom: 20px; }
        
        .order-card-footer { display: flex; align-items: center; justify-content: space-between; }
        .view-link { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; transition: var(--transition-fast); }
        .reorder-btn { height: 36px; padding: 0 20px; background: var(--navy); color: white; border-radius: 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

        .empty-history { padding: 80px 32px; text-align: center; display: flex; flex-direction: column; align-items: center; }
        .empty-icon-wrap { width: 80px; height: 80px; background: var(--bg-muted); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-light); margin-bottom: 32px; }
        .empty-title { font-size: 24px; font-weight: 800; color: var(--navy); margin-bottom: 12px; }
        .empty-text { font-size: 14px; color: var(--text-muted); font-weight: 500; line-height: 1.5; margin-bottom: 40px; max-width: 240px; }
        .start-btn { height: 56px; padding: 0 40px; background: var(--primary); color: white; border-radius: 16px; font-weight: 800; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 12px; box-shadow: 0 12px 32px rgba(75, 112, 245, 0.2); }
      `}</style>
    </div>
  );
}
