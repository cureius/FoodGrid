'use client';

import { useQuery } from '@tanstack/react-query';
import { listOrders, formatPrice, getOrderStatusInfo } from '@/lib/api/customer';
import { ChevronLeft, ChevronRight, ShoppingBag, Receipt } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OrdersHistoryPage() {
  const router = useRouter();
  
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders-history'],
    queryFn: () => listOrders(20, '1'), 
  });

  if (isLoading) {
    return (
        <div className="orders-loading">
            <div className="skeleton-title" />
            {[1,2,3].map(i => <div key={i} className="skeleton-card" />)}
            <style jsx>{`
                .orders-loading { min-height: 100vh; background: var(--bg-app); padding: 16px; display: flex; flex-direction: column; gap: 16px; }
                .skeleton-title { height: 32px; width: 50%; background: #eee; border-radius: 8px; animation: pulse 1.5s infinite; }
                .skeleton-card { height: 140px; width: 100%; background: #eee; border-radius: 20px; animation: pulse 1.5s infinite; }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
            `}</style>
        </div>
    )
  }

  return (
    <div className="orders-page">
      <header className="orders-header">
        <button onClick={() => router.push('/user')} className="back-btn">
          <ChevronLeft size={24} />
        </button>
        <h1 className="header-title">Your Orders</h1>
      </header>

      <main className="orders-main">
        {orders && orders.length > 0 ? (
            orders.map((order) => {
                const statusInfo = getOrderStatusInfo(order.status as any);
                return (
                    <div 
                        key={order.id}
                        onClick={() => router.push(`/user/orders/${order.id}`)}
                        className="order-card"
                    >
                        <div className="order-top">
                            <div className="order-brand-info">
                                <div className="brand-icon-wrap">
                                    <ShoppingBag size={24} />
                                </div>
                                <div className="brand-details">
                                    <h3 className="brand-name">Burger House</h3>
                                    <p className="item-summary">{order.items.map(i => i.itemName).join(', ')}</p>
                                    <div className="order-meta">
                                        <span>{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                        <div className="dot-divider" />
                                        <span className="order-total">{formatPrice(order.grandTotal)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="status-badge" style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color, borderColor: statusInfo.color }}>
                                {statusInfo.label}
                            </div>
                        </div>

                        <div className="card-divider" />

                        <div className="order-actions">
                             <button className="view-details-btn">
                                VIEW DETAILS
                                <ChevronRight size={14} />
                             </button>
                             <button className="reorder-btn" onClick={(e) => { e.stopPropagation(); /* Reorder logic */ }}>
                                REORDER
                             </button>
                        </div>
                    </div>
                );
            })
        ) : (
            <div className="empty-state">
                <Receipt size={64} className="empty-icon" />
                <h2 className="empty-title">No orders yet</h2>
                <p className="empty-text">You haven't placed any orders yet. Delicious food is waiting for you!</p>
                <button 
                  onClick={() => router.push('/user')}
                  className="start-ordering-btn"
                >
                    Order Now
                </button>
            </div>
        )}
      </main>

      <style jsx>{`
        .orders-page { background: var(--bg-app); min-height: 100vh; padding-bottom: 96px; }
        .orders-header { position: sticky; top: 0; z-index: 40; background: white; border-bottom: 1px solid var(--border-light); padding: 0 16px; height: 64px; display: flex; align-items: center; gap: 16px; }
        .back-btn { padding: 4px; margin-left: -4px; color: var(--navy); }
        .header-title { font-size: 18px; font-weight: 800; color: var(--navy); }

        .orders-main { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
        
        .order-card { background: white; border-radius: 24px; padding: 16px; shadow-sm: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid var(--border-light); cursor: pointer; transition: var(--transition-fast); }
        .order-card:active { transform: scale(0.98); }
        
        .order-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .order-brand-info { display: flex; gap: 12px; min-width: 0; }
        .brand-icon-wrap { width: 48px; height: 48px; background: var(--bg-muted); border-radius: 12px; border: 1px solid var(--border-light); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .brand-details { min-width: 0; }
        .brand-name { font-size: 14px; font-weight: 800; margin-bottom: 2px; }
        .item-summary { font-size: 11px; font-weight: 600; color: var(--text-light); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
        .order-meta { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .dot-divider { width: 4px; height: 4px; background: var(--border-medium); border-radius: 50%; }
        .order-total { font-weight: 800; color: var(--navy); }

        .status-badge { padding: 4px 8px; border-radius: 6px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; border: 1px solid transparent; }

        .card-divider { height: 1px; background: var(--border-light); margin-bottom: 16px; }

        .order-actions { display: flex; align-items: center; justify-content: space-between; }
        .view-details-btn { font-size: 11px; font-weight: 900; color: var(--primary); display: flex; align-items: center; gap: 4px; transition: var(--transition-fast); }
        .order-card:hover .view-details-btn { gap: 8px; }
        
        .reorder-btn { padding: 6px 16px; background: rgba(75, 112, 245, 0.1); color: var(--primary); border-radius: 10px; font-size: 12px; font-weight: 800; transition: var(--transition-fast); }
        .reorder-btn:hover { background: var(--primary); color: white; }

        .empty-state { padding: 80px 32px; text-align: center; }
        .empty-icon { color: var(--text-light); margin-bottom: 24px; }
        .empty-title { font-size: 20px; font-weight: 800; margin-bottom: 8px; }
        .empty-text { font-size: 14px; color: var(--text-muted); font-weight: 600; line-height: 1.5; margin-bottom: 32px; }
        .start-ordering-btn { background: var(--navy); color: white; padding: 12px 32px; border-radius: 16px; font-weight: 800; font-size: 14px; box-shadow: var(--shadow-md); }
      `}</style>
    </div>
  );
}
