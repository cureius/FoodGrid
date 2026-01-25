'use client';

import { useQuery } from '@tanstack/react-query';
import { getOrder, getOrderStatusInfo, formatPrice } from '@/lib/api/customer';
import { ChevronLeft, Phone, CheckCircle2, Circle, MessageSquare } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';

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
      <div className="order-loading">
        <div className="skeleton-header" />
        <div className="skeleton-main">
          <div className="skeleton-title" />
          <div className="skeleton-card" />
          <div className="skeleton-card large" />
        </div>
        <style jsx>{`
            .order-loading { min-height: 100vh; background: white; }
            .skeleton-header { height: 180px; background: var(--bg-muted); border-radius: 0 0 40px 40px; animation: pulse 1.5s infinite; }
            .skeleton-main { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
            .skeleton-title { height: 40px; width: 60%; background: var(--bg-muted); border-radius: 8px; animation: pulse 1.5s infinite; }
            .skeleton-card { height: 120px; background: var(--bg-muted); border-radius: 32px; animation: pulse 1.5s infinite; }
            .skeleton-card.large { height: 240px; }
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        `}</style>
      </div>
    );
  }

  if (!order) return <div className="error-state">Order not found</div>;

  const statusInfo = getOrderStatusInfo(order.status as any);

  const steps = [
    { key: 'PLACED', label: 'Order Placed', time: '10:45 AM' },
    { key: 'ACCEPTED', label: 'Accepted', time: '10:47 AM' },
    { key: 'PREPARING', label: 'Cooking', time: '10:55 AM' },
    { key: 'READY', label: 'Ready', time: '11:05 AM' },
    { key: 'DELIVERED', label: 'Delivered', time: '--:--' },
  ];

  return (
    <div className="order-details-page">
      <header className="order-header">
        <button onClick={() => router.push('/user/orders')} className="back-btn">
          <ChevronLeft size={24} />
        </button>
        <div className="header-titles">
          <h1 className="header-title">Track Order</h1>
          <p className="header-subtitle">Order #{order.id.slice(-6).toUpperCase()}</p>
        </div>
      </header>

      <main className="order-main">
        <div className="status-card card">
            <div 
                className="status-badge"
                style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
            >
                {statusInfo.label}
            </div>
            
            <h2 className="estimate-title">Estimated delivery in</h2>
            <div className="estimate-val-row">
                <span className="estimate-val">25</span>
                <span className="estimate-unit">mins</span>
            </div>

            <div className="timeline">
                <div className="timeline-line" />

                {steps.map((step, idx) => {
                    const isCompleted = statusInfo.step >= idx + 1 || (idx === 0 && order.status !== 'CANCELLED');
                    const isCurrent = statusInfo.step === idx;
                    
                    return (
                        <div key={step.key} className="timeline-step">
                            <div className={`step-icon-wrap ${isCompleted ? 'completed' : ''}`}>
                                {isCompleted ? (
                                    <CheckCircle2 size={16} />
                                ) : (
                                    <Circle size={10} fill="currentColor" />
                                )}
                                {isCurrent && (
                                    <motion.div 
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="pulse-ring"
                                    />
                                )}
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

        <div className="summary-card card">
            <h3 className="section-header">Order Summary</h3>
            <div className="summary-items">
                {order.items.map(item => (
                    <div key={item.id} className="summary-item">
                        <span className="item-name-wrap">
                            <span className="item-qty">1x</span> {item.itemName}
                        </span>
                        <span className="item-price">{formatPrice(item.lineTotal)}</span>
                    </div>
                ))}
            </div>
            <div className="summary-footer">
                <span className="footer-label">Total Paid</span>
                <span className="footer-val">{formatPrice(order.grandTotal)}</span>
            </div>
        </div>

        <div className="help-actions">
            <button className="help-btn">
                <div className="help-icon-wrap">
                    <Phone size={18} />
                </div>
                Support
            </button>
            <button 
                onClick={() => router.push('/user')}
                className="help-btn primary"
            >
                <div className="help-icon-wrap bg-white">
                    <MessageSquare size={18} />
                </div>
                Message
            </button>
        </div>
      </main>

      <style jsx>{`
        .order-details-page { background: var(--bg-app); min-height: 100vh; padding-bottom: 48px; }
        .order-header { position: sticky; top: 0; z-index: 40; background: white; border-bottom: 1px solid var(--border-light); height: 64px; display: flex; align-items: center; px: 16px; gap: 16px; padding: 0 16px; }
        .back-btn { padding: 4px; margin-left: -4px; color: var(--navy); }
        .header-titles { flex: 1; }
        .header-title { font-size: 18px; font-weight: 800; color: var(--navy); }
        .header-subtitle { font-size: 10px; color: var(--text-light); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }

        .order-main { padding: 12px; display: flex; flex-direction: column; gap: 12px; }
        .card { background: white; border-radius: 32px; border: 1px solid var(--border-light); box-shadow: var(--shadow-sm); padding: 24px; }
        
        .status-badge { display: inline-flex; px: 12px; py: 4px; padding: 4px 12px; border-radius: 999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 24px; }
        .estimate-title { font-size: 24px; font-weight: 800; color: var(--navy); margin-bottom: 4px; }
        .estimate-val-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 40px; }
        .estimate-val { font-size: 48px; font-weight: 900; color: var(--navy); letter-spacing: -2px; }
        .estimate-unit { font-size: 18px; font-weight: 700; color: var(--text-light); text-transform: uppercase; }

        .timeline { position: relative; padding-left: 40px; display: flex; flex-direction: column; gap: 40px; }
        .timeline-line { position: absolute; left: 13px; top: 10px; bottom: 10px; width: 2px; background: var(--bg-muted); }
        .timeline-step { position: relative; display: flex; align-items: center; }
        .step-icon-wrap { position: absolute; left: -40px; width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--border-light); background: white; display: flex; align-items: center; justify-content: center; z-index: 10; color: var(--text-light); transition: var(--transition-normal); }
        .step-icon-wrap.completed { background: var(--success); border-color: var(--success); color: white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
        .pulse-ring { position: absolute; inset: 0; background: var(--success); border-radius: 50%; }

        .step-content { flex: 1; display: flex; justify-content: space-between; align-items: center; }
        .step-label { font-size: 14px; font-weight: 700; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px; transition: var(--transition-fast); }
        .step-label.active { color: var(--navy); font-weight: 800; }
        .step-time { font-size: 10px; font-weight: 800; color: var(--text-light); }

        .section-header { font-size: 11px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--bg-muted); padding-bottom: 16px; margin-bottom: 24px; }
        .summary-items { display: flex; flex-direction: column; gap: 16px; }
        .summary-item { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 700; color: var(--text-muted); }
        .item-name-wrap { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .item-qty { font-weight: 900; color: var(--navy); }
        .item-price { font-weight: 800; color: var(--navy); }
        .summary-footer { margin-top: 32px; padding-top: 24px; border-top: 1px dashed var(--border-light); display: flex; justify-content: space-between; align-items: center; }
        .footer-label { font-size: 14px; font-weight: 800; color: var(--navy); text-transform: uppercase; letter-spacing: 1px; }
        .footer-val { font-size: 20px; font-weight: 900; color: var(--primary); }

        .help-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
        .help-btn { height: 64px; background: white; border: 1px solid var(--border-light); border-radius: 24px; display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--navy); box-shadow: var(--shadow-sm); transition: var(--transition-fast); }
        .help-btn:active { transform: scale(0.98); }
        .help-btn.primary { background: var(--navy); color: white; }
        .help-icon-wrap { width: 36px; height: 36px; background: var(--primary-light); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--primary); }
        .help-icon-wrap.bg-white { background: rgba(255, 255, 255, 0.1); color: white; }

        .error-state { padding: 80px 32px; text-align: center; color: var(--text-light); font-weight: 800; }
      `}</style>
    </div>
  );
}
