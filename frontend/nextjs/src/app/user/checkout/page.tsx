'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart';
import { createOrder, formatPrice, calculateCartTotal } from '@/lib/api/customer';
import { ChevronLeft, ShieldCheck, Wallet, CreditCard, Landmark, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, outletId, orderType, clearCart } = useCartStore();
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'CARD' | 'NB' | 'CASH'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { total } = calculateCartTotal(items);

  const orderMutation = useMutation({
    mutationFn: (data: any) => createOrder(data),
    onSuccess: (order) => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        clearCart();
        router.replace(`/user/orders/${order.id}`);
      }, 2500);
    },
    onError: (err) => {
      setIsProcessing(false);
      alert('Order failed! Please try again.');
    }
  });

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
        orderMutation.mutate({
            outletId: outletId!,
            orderType,
            items: items.map(i => ({ itemId: i.menuItemId, qty: i.quantity })),
            customerName: 'Guest User',
        });
    }, 1500);
  };

  if (isSuccess) {
    return (
        <div className="success-screen">
            <motion.div 
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               className="success-icon-wrap"
            >
                <CheckCircle2 size={48} strokeWidth={3} />
            </motion.div>
            <h2 className="success-title">Order Success!</h2>
            <p className="success-text">Your food is being prepared. Redirecting to tracking...</p>
            <style jsx>{`
              .success-screen { min-height: 100vh; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px; text-align: center; }
              .success-icon-wrap { width: 96px; height: 96px; background: var(--success); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; margin-bottom: 24px; box-shadow: 0 12px 32px rgba(16, 185, 129, 0.3); }
              .success-title { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
              .success-text { color: var(--text-muted); font-weight: 600; }
            `}</style>
        </div>
    )
  }

  return (
    <div className="checkout-page">
      {/* Header */}
      <header className="checkout-header">
        <button onClick={() => router.back()} className="back-btn">
          <ChevronLeft size={24} />
        </button>
        <h1 className="header-title">Payment Methods</h1>
      </header>

      {/* Amount Banner */}
      <div className="amount-banner">
         <span className="amount-label">Amount Payable</span>
         <span className="amount-val">{formatPrice(total)}</span>
      </div>

      <section className="payment-body">
        <div className="method-group">
           <h3 className="group-title">Choose Payment Method</h3>
           <div className="methods-list">
            {[
                { id: 'UPI', label: 'UPI (GPay / PhonePe / Paytm)', icon: Wallet, color: '#4B70F5' },
                { id: 'CARD', label: 'Credit / Debit Card', icon: CreditCard, color: '#F69B42' },
                { id: 'NB', label: 'Net Banking', icon: Landmark, color: '#10B981' },
                { id: 'CASH', label: 'Cash on Delivery', icon: ShieldCheck, color: '#6B7280' },
            ].map((method) => (
                <button 
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id as any)}
                  className={`method-btn ${selectedMethod === method.id ? 'active' : ''}`}
                >
                    <div className="method-icon-wrap" style={{ color: method.color }}>
                        <method.icon size={22} />
                    </div>
                    <span className="method-label">{method.label}</span>
                    <div className="radio-circle">
                        {selectedMethod === method.id && <div className="radio-dot" />}
                    </div>
                </button>
            ))}
           </div>
        </div>

        {/* Security Info */}
        <div className="security-card">
            <ShieldCheck className="security-icon" size={24} />
            <div className="security-content">
                <span className="security-title">Secure Payments</span>
                <p className="security-text">Your transaction is 256-bit SSL encrypted. We use industry-standard payment processors for maximum security.</p>
            </div>
        </div>
      </section>

      {/* Action Bar */}
      <div className="bottom-bar">
         <button
            disabled={isProcessing}
            onClick={handlePay}
            className="pay-btn"
         >
            {isProcessing ? (
                <div className="loader-row">
                    <div className="small-spinner" />
                    Verifying Payment...
                </div>
            ) : (
                `Pay ${formatPrice(total)}`
            )}
         </button>
      </div>

      <style jsx>{`
        .checkout-page { background: var(--bg-app); min-height: 100vh; padding-bottom: 120px; }
        .checkout-header { position: sticky; top: 0; z-index: 40; background: white; border-bottom: 1px solid var(--border-light); padding: 0 16px; height: 64px; display: flex; align-items: center; gap: 16px; }
        .back-btn { padding: 4px; margin-left: -4px; color: var(--text-main); }
        .header-title { font-size: 18px; font-weight: 800; }
        
        .amount-banner { background: rgba(75, 112, 245, 0.05); border-bottom: 1px solid rgba(75, 112, 245, 0.1); padding: 32px 24px; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .amount-label { font-size: 10px; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
        .amount-val { font-size: 36px; font-weight: 800; color: var(--navy); }

        .payment-body { padding: 32px 16px; display: flex; flex-direction: column; gap: 32px; }
        .method-group { display: flex; flex-direction: column; gap: 16px; }
        .group-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--text-light); padding-left: 4px; }
        .methods-list { background: white; border-radius: 20px; border: 1px solid var(--border-light); overflow: hidden; box-shadow: var(--shadow-sm); }
        
        .method-btn { width: 100%; height: 64px; padding: 0 16px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid var(--border-light); transition: var(--transition-fast); text-align: left; }
        .method-btn:last-child { border-bottom: none; }
        .method-btn:hover { background: var(--bg-muted); }
        .method-btn.active { background: var(--primary-light); }
        
        .method-icon-wrap { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
        .method-label { flex: 1; font-size: 14px; font-weight: 700; color: var(--navy); }
        
        .radio-circle { width: 20px; height: 20px; border: 2px solid var(--border-medium); border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: var(--transition-fast); }
        .method-btn.active .radio-circle { border-color: var(--primary); background: var(--primary); }
        .radio-dot { width: 6px; height: 6px; background: white; border-radius: 50%; }

        .security-card { background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 16px; padding: 16px; display: flex; gap: 16px; }
        .security-icon { color: var(--success); flex-shrink: 0; }
        .security-content { display: flex; flex-direction: column; gap: 4px; }
        .security-title { font-size: 11px; font-weight: 800; color: var(--success); text-transform: uppercase; }
        .security-text { font-size: 10px; font-weight: 600; line-height: 1.5; color: var(--text-muted); }

        .bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; background: white; padding: 16px; border-top: 1px solid var(--border-light); box-shadow: 0 -10px 40px rgba(0,0,0,0.08); padding-bottom: calc(16px + env(safe-area-inset-bottom)); }
        .pay-btn { max-width: 418px; margin: 0 auto; width: 100%; background: var(--navy); color: white; height: 56px; border-radius: 16px; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 12px 24px rgba(0,0,0,0.15); transition: var(--transition-fast); }
        .pay-btn:active { transform: scale(0.98); }
        .pay-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .loader-row { display: flex; align-items: center; justify-content: center; gap: 12px; }
        .small-spinner { width: 20px; height: 20px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
