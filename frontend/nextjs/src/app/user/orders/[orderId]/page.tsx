'use client';

import { useQuery } from '@tanstack/react-query';
import { getOrder, getOrderStatusInfo, formatPrice } from '@/lib/api/customer';
import { ChevronLeft, Phone, CheckCircle2, Circle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function OrderDetailsPage() {
  const router = useRouter();
  const { orderId } = useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId as string),
    refetchInterval: 10000, 
  });

  if (isLoading) {
    return (
      <div className="order-details-loading">
        <div className="skeleton-header" />
        <div className="p-24 space-y-16">
          <div className="skeleton-title" />
          <div className="skeleton-text" />
        </div>
        <style jsx>{`
            .order-details-loading { min-height: 100vh; background: white; }
            .skeleton-header { height: 180px; background: #eee; animation: pulse 1.5s infinite; }
            .p-24 { padding: 24px; }
            .space-y-16 { display: flex; flex-direction: column; gap: 16px; }
            .skeleton-title { height: 32px; width: 60%; background: #eee; border-radius: 8px; animation: pulse 1.5s infinite; }
            .skeleton-text { height: 100px; width: 100%; background: #eee; border-radius: 12px; animation: pulse 1.5s infinite; }
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        `}</style>
      </div>
    );
  }

  if (!order) return <div className="p-40 text-center">Order not found</div>;

  const statusInfo = getOrderStatusInfo(order.status as any);

  const steps = [
    { key: 'PLACED', label: 'Order Placed', time: '10:45 AM' },
    { key: 'ACCEPTED', label: 'Accepted', time: '10:47 AM' },
    { key: 'PREPARING', label: 'Cooking', time: '10:55 AM' },
    { key: 'READY', label: 'Ready', time: '11:05 AM' },
    { key: 'DELIVERED', label: 'Delivered', time: '--:--' },
  ];

  return (
    <div className="tracking-page">
      {/* Header */}
      <header className="tracking-header">
        <button onClick={() => router.push('/user/orders')} className="back-btn">
          <ChevronLeft size={24} />
        </button>
        <div className="header-titles">
          <h1 className="header-title">Track Order</h1>
          <p className="header-subtitle">Order #{order.id.slice(-6).toUpperCase()}</p>
        </div>
      </header>

      {/* Main Stats */}
      <main className="tracking-main">
        {/* Progress Card */}
        <div className="status-card">
            <div className="status-badge" style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}>
                {statusInfo.label}
            </div>
            
            <h2 className="estimate-title">Estimated delivery in</h2>
            <div className="estimate-row">
                <span className="estimate-val">25</span>
                <span className="estimate-unit">mins</span>
            </div>

            {/* Timeline */}
            <div className="timeline">
                <div className="timeline-line" />

                {steps.map((step, idx) => {
                    const isCompleted = statusInfo.step >= idx + 1 || (idx === 0 && order.status !== 'CANCELLED');
                    
                    return (
                        <div key={step.key} className="timeline-step">
                            <div className={`step-dot ${isCompleted ? 'completed' : ''}`}>
                                {isCompleted ? <CheckCircle2 size={14} /> : <Circle size={10} fill="currentColor" />}
                            </div>
                            <div className="step-content">
                                <span className={`step-label ${isCompleted ? 'active' : ''}`}>
                                    {step.label}
                                </span>
                                <span className="step-time">{step.time}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Order Items Summary */}
        <div className="summary-card">
            <h3 className="summary-title">Order Items</h3>
            <div className="items-list">
                {order.items.map(item => (
                    <div key={item.id} className="summary-item">
                        <span className="item-name">
                            <span className="item-qty">{item.qty}x</span> {item.itemName}
                        </span>
                        <span className="item-price">{formatPrice(item.lineTotal)}</span>
                    </div>
                ))}
            </div>
            <div className="summary-footer">
                <span className="total-label">Total Paid</span>
                <span className="total-val">{formatPrice(order.grandTotal)}</span>
            </div>
        </div>

        {/* Help Actions */}
        <div className="help-actions">
            <button className="help-btn white">
                <Phone size={18} className="icon-blue" />
                Contact Help
            </button>
            <button 
                onClick={() => router.push('/user')}
                className="help-btn dark"
            >
                Order More
            </button>
        </div>
      </main>

      <style jsx>{`
        .tracking-page { background: var(--bg-app); min-height: 100vh; padding-bottom: 32px; }
        .tracking-header { position: sticky; top: 0; z-index: 40; background: white; border-bottom: 1px solid var(--border-light); height: 64px; display: flex; align-items: center; padding: 0 16px; gap: 16px; }
        .back-btn { padding: 4px; margin-left: -4px; color: var(--navy); }
        .header-titles { flex: 1; }
        .header-title { font-size: 18px; font-weight: 800; }
        .header-subtitle { font-size: 10px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }

        .tracking-main { padding: 24px 16px; display: flex; flex-direction: column; gap: 24px; }
        
        .status-card { background: white; border-radius: 32px; padding: 24px; border: 1px solid var(--border-light); box-shadow: var(--shadow-sm); }
        .status-badge { display: inline-flex; padding: 4px 12px; border-radius: 999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
        .estimate-title { font-size: 24px; font-weight: 800; color: var(--navy); margin-bottom: 4px; }
        .estimate-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 32px; }
        .estimate-val { font-size: 40px; font-weight: 900; color: var(--navy); line-height: 1; }
        .estimate-unit { font-size: 20px; font-weight: 700; color: var(--text-muted); }

        .timeline { position: relative; padding-left: 32px; display: flex; flex-direction: column; gap: 32px; }
        .timeline-line { position: absolute; left: 11px; top: 8px; bottom: 8px; width: 2px; background: var(--border-light); }
        
        .timeline-step { position: relative; display: flex; align-items: center; }
        .step-dot { position: absolute; left: -32px; top: 0; width: 24px; height: 24px; border-radius: 50%; background: white; border: 2px solid var(--border-light); display: flex; align-items: center; justify-content: center; color: var(--text-light); z-index: 2; transition: var(--transition-normal); }
        .step-dot.completed { background: var(--success); border-color: var(--success); color: white; }
        
        .step-content { flex: 1; display: flex; justify-content: space-between; align-items: center; }
        .step-label { font-size: 14px; font-weight: 700; color: var(--text-light); transition: var(--transition-normal); }
        .step-label.active { color: var(--navy); font-weight: 800; }
        .step-time { font-size: 10px; font-weight: 600; color: var(--text-light); }

        .summary-card { background: white; border-radius: 32px; padding: 24px; border: 1px solid var(--border-light); box-shadow: var(--shadow-sm); }
        .summary-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 16px; border-bottom: 1px solid var(--border-light); padding-bottom: 8px; }
        .items-list { display: flex; flex-direction: column; gap: 12px; }
        .summary-item { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 600; color: var(--text-muted); }
        .item-qty { font-weight: 800; color: var(--navy); margin-right: 4px; }
        .item-price { font-weight: 700; color: var(--navy); }
        
        .summary-footer { margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--border-light); display: flex; justify-content: space-between; align-items: center; }
        .total-label { font-size: 14px; font-weight: 800; color: var(--navy); }
        .total-val { font-size: 18px; font-weight: 800; color: var(--primary); }

        .help-actions { display: flex; gap: 16px; }
        .help-btn { flex: 1; height: 56px; border-radius: 16px; font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 12px; transition: var(--transition-fast); box-shadow: var(--shadow-sm); }
        .help-btn:active { transform: scale(0.98); }
        .help-btn.white { background: white; border: 1px solid var(--border-light); color: var(--navy); }
        .help-btn.dark { background: var(--navy); color: white; }
        .icon-blue { color: var(--primary); }
      `}</style>
    </div>
  );
}
