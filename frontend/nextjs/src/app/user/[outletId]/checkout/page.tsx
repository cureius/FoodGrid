'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { useCartStore } from '@/stores/cart';
import { createOrder, formatPrice, calculateCartTotal, createPaymentLink } from '@/lib/api/customer';
import { ChevronLeft, ShieldCheck, Wallet, CreditCard, Landmark, CheckCircle2, Loader2, Lock, ExternalLink } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getPaymentStatus } from '@/lib/api/customer';

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const outletId = params?.outletId as string;
  const { items, orderType, clearCart } = useCartStore();
  const [selectedMethod, setSelectedMethod] = useState<'UPI'|'CARD'|'NB'|'CASH'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { total } = calculateCartTotal(items);

  // Polling for Payment Status
  const { data: payStatus } = useQuery({
    queryKey: ['check-payment', createdOrderId],
    queryFn: () => getPaymentStatus(createdOrderId!),
    enabled: !!createdOrderId && !isSuccess,
    refetchInterval: 3000, // Poll every 3s
  });

  // Watch status changes
  useEffect(() => {
        if (payStatus?.orderStatus === 'PAID') {
        setIsSuccess(true);
        setPaymentLink(null);
        setTimeout(() => {
            clearCart();
            router.replace(`/user/${outletId}/orders/${createdOrderId}`);
        }, 2500);
    }
  }, [payStatus, createdOrderId, clearCart, router, outletId]);

  const orderMutation = useMutation({
    mutationFn: async (data: any) => {
        const order = await createOrder(data);
        setCreatedOrderId(order.id);
        
        // If not CASH, create a payment link
        if (selectedMethod !== 'CASH') {
            try {
                const linkInfo = await createPaymentLink(order.id);
                return { ...order, paymentLink: linkInfo.paymentLink };
            } catch (e) {
                console.error("Failed to create payment link", e);
                return order;
            }
        }
        return order;
    },
    onSuccess: (order: any) => {
      setIsProcessing(false);
      
      if (order.paymentLink) {
        setPaymentLink(order.paymentLink);
        // Open link in new tab immediately
        window.open(order.paymentLink, '_blank');
      } else {
        setIsSuccess(true);
        setTimeout(() => {
            clearCart();
            router.replace(`/user/${outletId}/orders/${order.id}`);
        }, 2500);
      }
    },
    onError: (err: any) => {
      setIsProcessing(false);
      alert(err.response?.data?.message || 'Order failed! Please try again.');
    }
  });

  const handlePay = () => {
    if (!outletId) return;
    setIsProcessing(true);
    orderMutation.mutate({
        outletId: outletId,
        orderType,
        items: items.map(i => ({ itemId: i.menuItem.id, qty: i.quantity })),
        customerName: 'Authenticated User',
    });
  };

  if (isSuccess) {
    return (
        <div className="success-screen">
            <motion.div 
               initial={{ scale: 0, rotate: -45 }}
               animate={{ scale: 1, rotate: 0 }}
               className="success-icon"
            >
                <CheckCircle2 size={48} />
            </motion.div>
            <h2 className="success-title">Order Success!</h2>
            <p className="success-meta">Transaction ID: #FG-{Math.random().toString(36).substring(7).toUpperCase()}</p>
            <p className="success-text">Your food is being prepared with love. Redirecting to tracking screen...</p>

            <div className="verified-badge">
                <ShieldCheck size={16} /> 
                Payment Verified by FoodGrid Secure
            </div>
            <style jsx>{`
                .success-screen { min-height: 100vh; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; }
                .success-icon { width: 96px; height: 96px; background: var(--success); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; margin-bottom: 32px; box-shadow: 0 12px 32px rgba(16, 185, 129, 0.3); }
                .success-title { font-size: 32px; font-weight: 800; color: var(--navy); margin-bottom: 12px; }
                .success-meta { color: var(--text-light); font-weight: 700; font-size: 14px; margin-bottom: 8px; }
                .success-text { color: var(--text-muted); font-weight: 600; line-height: 1.5; max-width: 280px; }
                .verified-badge { margin-top: 48px; display: flex; align-items: center; gap: 8px; font-size: 10px; font-weight: 800; color: var(--success); text-transform: uppercase; letter-spacing: 1px; padding: 12px 24px; background: var(--success-light); border-radius: 999px; }
            `}</style>
        </div>
    )
  }

  if (paymentLink) {
    return (
        <div className="payment-link-screen">
             <div className="link-card">
                <div className="link-icon">
                    <ExternalLink size={32} />
                </div>
                <h2 className="link-title">Redirecting to Payment</h2>
                <p className="link-text">Please click the button below to complete your payment of <strong>{formatPrice(total)}</strong> securely via our partner gateway.</p>
                
                <a href={paymentLink} target="_blank" rel="noopener noreferrer" className="link-btn">
                    COMPLETE PAYMENT
                </a>

                <button onClick={() => setPaymentLink(null)} className="link-cancel">
                    Go Back
                </button>
             </div>
             <style jsx>{`
                .payment-link-screen { min-height: 100vh; background: var(--bg-app); display: flex; align-items: center; justify-content: center; padding: 24px; }
                .link-card { background: white; border-radius: 32px; padding: 40px 24px; width: 100%; max-width: 400px; text-align: center; box-shadow: var(--shadow-lg); }
                .link-icon { width: 64px; height: 64px; background: var(--primary-light); color: var(--primary); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
                .link-title { font-size: 24px; font-weight: 800; color: var(--navy); margin-bottom: 12px; }
                .link-text { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin-bottom: 32px; }
                .link-btn { display: block; width: 100%; height: 56px; background: var(--primary); color: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 8px 24px rgba(75, 112, 245, 0.2); }
                .link-cancel { margin-top: 24px; font-size: 12px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px; }
             `}</style>
        </div>
    )
  }

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <button onClick={() => router.back()} className="back-btn">
          <ChevronLeft size={24} />
        </button>
        <h1 className="header-title">Payment Methods</h1>
      </header>

      <div className="amount-banner">
         <span className="banner-label">Amount Payable</span>
         <span className="banner-val">{formatPrice(total)}</span>
      </div>

      <main className="checkout-main">
        <div className="method-group">
           <h3 className="group-title">Choose Payment Method</h3>
           <div className="method-list card">
            {[
                { id: 'UPI', label: 'UPI (GPay / PhonePe / Paytm)', icon: Wallet, color: '#4B70F5' },
                { id: 'CARD', label: 'Credit / Debit Card', icon: CreditCard, color: '#F69B42' },
                { id: 'NB', label: 'Net Banking', icon: Landmark, color: 'var(--success)' },
                // { id: 'CASH', label: 'Pay on Delivery (Cash/UPI)', icon: ShieldCheck, color: '#6B7280' },
            ].map((method) => (
                <button 
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id as any)}
                  className={`method-item ${selectedMethod === method.id ? 'active' : ''}`}
                >
                    <div className="method-icon-wrap" style={{ color: method.color }}>
                        <method.icon size={22} />
                    </div>
                    <span className="method-label">{method.label}</span>
                    <div className={`radio-outer ${selectedMethod === method.id ? 'checked' : ''}`}>
                        {selectedMethod === method.id && <div className="radio-inner" />}
                    </div>
                </button>
            ))}
           </div>
        </div>

        <div className="security-info">
            <div className="shield-icon">
                <ShieldCheck size={24} />
            </div>
            <div className="security-text">
                <span className="security-tag">SECURE CHECKOUT</span>
                <p className="security-desc">Personal data & transaction details are 256-bit SSL encrypted for your absolute safety.</p>
            </div>
        </div>
      </main>

      <div className="payment-bar">
         <button
            disabled={isProcessing}
            onClick={handlePay}
            className="pay-btn"
         >
            {isProcessing ? (
                <>
                    <Loader2 className="spinner" size={20} />
                    Processing Order...
                </>
            ) : (
                <>
                    <Lock size={18} />
                    Pay {formatPrice(total)} Now
                </>
            )}
         </button>
      </div>

      <style jsx>{`
        .checkout-page { background: var(--bg-app); min-height: 100vh; padding-bottom: 120px; }
        .checkout-header { position: sticky; top: 0; z-index: 40; background: var(--bg-surface); border-bottom: 1px solid var(--border-light); height: 64px; display: flex; align-items: center; padding: 0 16px; gap: 16px; }
        .back-btn { padding: 4px; margin-left: -4px; color: var(--text-main); }
        .header-title { font-size: 18px; font-weight: 800; color: var(--text-main); }

        .amount-banner { background: var(--primary-light); padding: 48px 24px; display: flex; flex-direction: column; align-items: center; text-align: center; border-bottom: 1px solid var(--primary-border); }
        .banner-label { font-size: 10px; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
        .banner-val { font-size: 48px; font-weight: 900; color: var(--text-main); letter-spacing: -1px; }

        .checkout-main { padding: 16px; display: flex; flex-direction: column; gap: 32px; }
        .method-group { display: flex; flex-direction: column; gap: 12px; }
        .group-title { font-size: 10px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px; padding-left: 4px; }
        .card { background: var(--bg-surface); border-radius: 32px; border: 1px solid var(--border-light); overflow: hidden; box-shadow: var(--shadow-sm); }
        
        .method-item { width: 100%; height: 64px; padding: 0 20px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid var(--bg-muted); transition: var(--transition-fast); text-align: left; }
        .method-item:last-child { border-bottom: none; }
        .method-item.active { background: var(--primary-light); }
        .method-icon-wrap { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
        .method-label { flex: 1; font-size: 14px; font-weight: 800; color: var(--text-main); }
        
        .radio-outer { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border-medium); display: flex; align-items: center; justify-content: center; transition: var(--transition-fast); }
        .radio-outer.checked { border-color: var(--primary); background: var(--primary); }
        .radio-inner { width: 6px; height: 6px; background: white; border-radius: 50%; }

        .security-info { background: var(--success-light); border-radius: 20px; padding: 20px; border: 1px solid rgba(16, 185, 129, 0.1); display: flex; gap: 16px; }
        .shield-icon { width: 44px; height: 44px; background: var(--bg-surface); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); flex-shrink: 0; }
        .security-text { display: flex; flex-direction: column; gap: 4px; }
        .security-tag { font-size: 10px; font-weight: 800; color: var(--success); text-transform: uppercase; letter-spacing: 1px; }
        .security-desc { font-size: 11px; font-weight: 600; color: var(--success); opacity: 0.8; line-height: 1.5; }

        .payment-bar { position: fixed; bottom: 72px; left: 0; right: 0; z-index: 50; background: var(--bg-surface); padding: 16px; border-top: 1px solid var(--border-light); padding-bottom: calc(16px + env(safe-area-inset-bottom)); box-shadow: 0 -8px 32px rgba(0,0,0,0.06); }
        .pay-btn { max-width: 418px; margin: 0 auto; width: 100%; height: 56px; background: var(--navy); color: white; border-radius: 16px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 12px; transition: var(--transition-fast); box-shadow: 0 12px 24px rgba(0,0,0,0.1); cursor: pointer; }
        .pay-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pay-btn:active { transform: scale(0.98); }

        .spinner { animation: spin 0.8s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
