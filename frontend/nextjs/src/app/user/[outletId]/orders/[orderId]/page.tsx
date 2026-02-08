'use client';

import { useQuery } from '@tanstack/react-query';
import { getOrder, getOrderStatusInfo, formatPrice, getPaymentStatus } from '@/lib/api/customer';
import { ChevronLeft, Phone, CheckCircle2, Circle, MessageSquare, Clock, MapPin, ReceiptText } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.orderId as string;
  const outletId = params?.outletId as string;

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId as string),
    refetchInterval: 10000, 
  });

  const { data: payStatus } = useQuery({
    queryKey: ['payment-status', orderId],
    queryFn: () => getPaymentStatus(orderId as string),
    enabled: !!order && (order.status === 'OPEN' || order.status === 'BILLED'),
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="loading-page">
        <div className="skeleton-hero" />
        <div className="skeleton-content">
          <div className="skeleton-card large" />
          <div className="skeleton-card medium" />
        </div>
        <style jsx>{`
            .loading-page { min-height: 100vh; background: var(--bg-surface); }
            .skeleton-hero { height: 180px; background: var(--bg-muted); border-radius: 0 0 40px 40px; animation: pulse 1.5s infinite; }
            .skeleton-content { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
            .skeleton-card { background: var(--bg-muted); border-radius: 32px; animation: pulse 1.5s infinite; }
            .skeleton-card.large { height: 240px; }
            .skeleton-card.medium { height: 160px; }
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        `}</style>
      </div>
    );
  }

  if (!order) return <div className="error-state">Order not found</div>;

  const statusInfo = getOrderStatusInfo(order.status as any, order.orderType as any);

  const dineInSteps = [
    { key: 'OPEN', label: 'Order Placed' },
    { key: 'KOT_SENT', label: 'In Kitchen' },
    { key: 'SERVED', label: 'Served' },
    { key: 'BILLED', label: 'Billed' },
    { key: 'PAID', label: 'Paid' },
  ];

  const takeawaySteps = [
    { key: 'OPEN', label: 'Order Placed' },
    { key: 'BILLED', label: 'Billed' },
    { key: 'PAID', label: 'Payment Done' },
    { key: 'KOT_SENT', label: 'Preparing' },
    { key: 'SERVED', label: 'Ready for Pickup' },
  ];

  const steps = order.orderType === 'DINE_IN' ? dineInSteps : takeawaySteps;

  return (
    <div className="order-details-page">
      <header className="track-header">
        <button onClick={() => router.push(`/user/${outletId}/orders`)} className="back-btn">
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="header-info">
          <h1 className="header-title">Track Order</h1>
          <p className="order-id-label">Order #{order.id.slice(-4).toUpperCase()}</p>
        </div>
      </header>
      

      <main className="track-main">

        {/* Order Items */}
        <section className="card summary-card">
            <h3 className="section-title">Order Summary</h3>
            <div className="items-list">
                {order.items.map(item => (
                    <div key={item.id} className="summary-item">
                        <div className="item-left">
                            <span className="qty-tag">{item.qty}x</span>
                            <span className="name-tag">{item.itemName}</span>
                        </div>
                        <span className="price-tag">{formatPrice(item.lineTotal)}</span>
                    </div>
                ))}
            </div>
            <div className="bill-divider" />
            <div className="total-row">
                <span className="total-label">Total Amount</span>
                <span className="total-val">{formatPrice(order.grandTotal)}</span>
            </div>
        </section>
        
        {/* Progress Card */}
        <section className="card status-card">
            <div 
                className="status-badge"
                style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
            >
                {statusInfo.label}
            </div>
            
            <h2 className="eta-title">
                {order.status === 'PAID' && order.orderType === 'TAKEAWAY' ? 'Ready soon' : 
                 order.status === 'SERVED' ? 'Enjoy your meal!' : 'Estimated in'}
            </h2>
            <div className="eta-timer">
                <span className="eta-val">
                    {order.status === 'SERVED' ? '0' : '15'}
                </span>
                <span className="eta-unit">mins</span>
            </div>

            {/* Timeline */}
            <div className="timeline">
                <div className="timeline-line" />

                {steps.map((step, idx) => {
                    const isCompleted = statusInfo.step >= idx;
                    const isCurrent = statusInfo.step === idx;
                    
                    return (
                        <div key={step.key} className={`timeline-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                            <div className="dot-wrap">
                                {isCompleted ? (
                                    <CheckCircle2 size={16} strokeWidth={3} />
                                ) : (
                                    <div className="dot-inner" />
                                )}
                                {isCurrent && order.status !== 'CANCELLED' && (
                                    <motion.div 
                                        animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="pulse-ring"
                                    />
                                )}
                            </div>
                            <div className="item-label-wrap">
                                <span className="item-label">{step.label}</span>
                                {isCurrent && <span className="time-tag">JUST NOW</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
        {/* Address & Payment Info */}
        <section className="card info-card">
            {/* <div className="info-row">
                <div className="icon-box pin">
                    <MapPin size={18} />
                </div>
                <div className="row-content">
                    <h3 className="row-title">Delivery Address</h3>
                    <p className="row-text">402, Skyline residency, 4th cross, Koramangala...</p>
                </div>
            </div> */}
            <div className="info-row">
                <div className="icon-box wallet">
                    <ReceiptText size={18} />
                </div>
                <div className="row-content">
                    <h3 className="row-title">Payment Mode</h3>
                    <p className="row-text">{order.status === 'PAID' ? 'Amount Paid' : 'Pay via UPI/Cash'} • {formatPrice(order.grandTotal)}</p>
                </div>
                {order.status === 'OPEN' && (
                    <div className="unpaid-alert"></div>
                )}
            </div>
        </section>

        {/* Help Actions */}
        <div className="actions-grid">
            <button className="action-btn secondary" onClick={() => window.open('tel:8583944249')}>
                <div className="icon-wrap color-primary">
                    <Phone size={18} strokeWidth={2.5} />
                </div>
                Support
            </button>
            {/* <button 
                onClick={() => router.push('/user')}
                className="action-btn primary"
            >
                <div className="icon-wrap color-white">
                    <MessageSquare size={18} strokeWidth={2.5} />
                </div>
                Message
            </button> */}
        </div>
      </main>

      <style jsx>{`
        .order-details-page { min-height: 100vh; background: var(--bg-app); pb-12; }
        .track-header { position: sticky; top: 0; z-index: 40; background: var(--bg-surface); border-bottom: 1px solid var(--border-light); height: 64px; display: flex; align-items: center; px-16; gap: 16px; padding: 0 16px; }
        .back-btn { padding: 8px; margin-left: -8px; color: var(--text-primary); border-radius: 50%; transition: var(--transition-fast); }
        .back-btn:hover { background: var(--bg-muted); }
        .header-info { flex: 1; }
        .header-title { font-size: 18px; font-weight: 800; color: var(--text-primary); line-height: 1; }
        .order-id-label { font-size: 10px; color: var(--text-light); font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px; }

        .track-main { padding: 12px; display: flex; flex-direction: column; gap: 12px;, margin-bottom: 72px; margin-bottom: 72px; }
        .card { background: var(--bg-surface); border-radius: 32px; padding: 24px; border: 1px solid var(--border-light); box-shadow: var(--shadow-sm); }
        
        .status-badge { display: inline-flex; padding: 4px 12px; border-radius: 999px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 24px; }
        .eta-title { font-size: 24px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; letter-spacing: -0.5px; }
        .eta-timer { display: flex; align-items: baseline; gap: 8px; margin-bottom: 40px; }
        .eta-val { font-size: 48px; font-weight: 900; color: var(--text-primary); letter-spacing: -2px; }
        .eta-unit { font-size: 18px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px; }

        .timeline { position: relative; padding-left: 40px; display: flex; flex-direction: column; gap: 40px; }
        .timeline-line { position: absolute; left: 13px; top: 8px; bottom: 8px; width: 2px; background: var(--bg-muted); }
        
        .timeline-item { position: relative; display: flex; align-items: center; justify-content: space-between; }
        .dot-wrap { position: absolute; left: -40px; width: 28px; height: 28px; background: var(--bg-surface); border: 2px solid var(--bg-muted); border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 10; color: var(--text-light); }
        .timeline-item.completed .dot-wrap { background: var(--success); border-color: var(--success); color: white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
        .timeline-item.current .dot-wrap { border-color: var(--success); }
        .dot-inner { width: 8px; height: 8px; background: currentColor; border-radius: 50%; }
        .pulse-ring { position: absolute; inset: 0; background: var(--success); border-radius: 50%; opacity: 0.3; }

        .item-label { font-size: 14px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px; transition: var(--transition-fast); }
        .timeline-item.completed .item-label { color: var(--text-primary); }
        .item-label-wrap { flex: 1; display: flex; justify-content: space-between; align-items: center; }
        .time-tag { font-size: 9px; font-weight: 900; color: var(--success); text-transform: uppercase; letter-spacing: 1px; animation: blink 2s infinite; }
        
        .info-card { display: flex; flex-direction: column; gap: 24px; }
        .info-row { display: flex; align-items: flex-start; gap: 16px; position: relative; }
        .icon-box { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .icon-box.pin { background: var(--primary-light); color: var(--primary); }
        .icon-box.wallet { background: var(--secondary-light); color: var(--secondary); }
        .row-title { font-size: 14px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
        .row-text { font-size: 12px; color: var(--text-muted); font-weight: 600; line-height: 1.4; }
        .unpaid-alert { position: absolute; right: 0; top: 0; font-size: 9px; font-weight: 900; background: var(--danger-light); color: var(--danger); padding: 4px 8px; border-radius: 6px; letter-spacing: 0.5px; }

        .summary-card { padding-top: 24px; }
        .section-title { font-size: 11px; font-weight: 900; color: var(--text-light); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 24px; border-bottom: 1px solid var(--bg-muted); padding-bottom: 12px; }
        .items-list { display: flex; flex-direction: column; gap: 16px; }
        .summary-item { display: flex; justify-content: space-between; align-items: center; }
        .item-left { display: flex; align-items: center; gap: 12px; }
        .qty-tag { font-size: 13px; font-weight: 900; color: var(--text-primary); min-width: 24px; }
        .name-tag { font-size: 13px; font-weight: 700; color: var(--text-muted); }
        .price-tag { font-size: 14px; font-weight: 800; color: var(--text-primary); }
        .bill-divider { height: 1px; border-top: 1px dashed var(--border-light); margin: 24px 0; }
        .total-row { display: flex; justify-content: space-between; align-items: center; }
        .total-label { font-size: 14px; font-weight: 800; color: var(--text-primary); text-transform: uppercase; letter-spacing: 1px; }
        .total-val { font-size: 20px; font-weight: 900; color: var(--primary); }

        .actions-grid { display: grid; grid-template-columns: 1fr 0fr; gap: 12px; margin-top: 12px; }
        .action-btn { height: 64px; border-radius: 20px; border: none; display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; transition: var(--transition-fast); box-shadow: var(--shadow-sm); cursor: pointer; }
        .action-btn.secondary { background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--border-light); }
        .action-btn.primary { background: var(--text-primary); color: white; }
        .action-btn:active { transform: scale(0.98); }
        .icon-wrap { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .color-primary { background: var(--primary-light); color: var(--primary); }
        .color-white { background: rgba(255,255,255,0.1); color: white; }

        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
        .error-state { padding: 100px 32px; text-align: center; font-weight: 800; color: var(--text-light); }
      `}</style>
    </div>
  );
}
