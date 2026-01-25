'use client';

import { useQuery } from '@tanstack/react-query';
import { getOrder, getOrderStatusInfo, formatPrice } from '@/lib/api/customer';
import { ChevronLeft, Phone, CheckCircle2, Circle, MessageSquare } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
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
      <div className="min-h-screen bg-white">
        <div className="h-48 bg-slate-100 animate-pulse rounded-b-[40px]" />
        <div className="p-6 space-y-6">
          <div className="h-10 w-1/2 bg-slate-50 rounded-lg animate-pulse" />
          <div className="h-32 w-full bg-slate-50 rounded-[32px] animate-pulse" />
          <div className="h-48 w-full bg-slate-50 rounded-[32px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!order) return <div className="p-20 text-center font-bold text-slate-400">Order not found</div>;

  const statusInfo = getOrderStatusInfo(order.status as any);

  const steps = [
    { key: 'PLACED', label: 'Order Placed', time: '10:45 AM' },
    { key: 'ACCEPTED', label: 'Accepted', time: '10:47 AM' },
    { key: 'PREPARING', label: 'Cooking', time: '10:55 AM' },
    { key: 'READY', label: 'Ready', time: '11:05 AM' },
    { key: 'DELIVERED', label: 'Delivered', time: '--:--' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 h-16 flex items-center px-4 gap-4">
        <button onClick={() => router.push('/user/orders')} className="p-2 -ml-2 text-navy hover:bg-slate-50 rounded-full transition-colors">
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-black text-navy leading-none">Track Order</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Order #{order.id.slice(-6).toUpperCase()}</p>
        </div>
      </header>

      <main className="p-3 space-y-3">
        {/* Progress Card */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
            <div 
                className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6"
                style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
            >
                {statusInfo.label}
            </div>
            
            <h2 className="text-2xl font-black text-navy mb-1 leading-tight tracking-tight">Estimated delivery in</h2>
            <div className="flex items-baseline gap-2 mb-10">
                <span className="text-5xl font-black text-navy tracking-tighter">25</span>
                <span className="text-lg font-bold text-slate-400 uppercase tracking-widest leading-none">mins</span>
            </div>

            {/* Timeline */}
            <div className="relative pl-10 space-y-10">
                <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-slate-100" />

                {steps.map((step, idx) => {
                    const isCompleted = statusInfo.step >= idx + 1 || (idx === 0 && order.status !== 'CANCELLED');
                    const isCurrent = statusInfo.step === idx;
                    
                    return (
                        <div key={step.key} className="relative flex items-center group">
                            <div className={cn(
                                'absolute -left-10 w-7 h-7 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-500 scale-90 group-hover:scale-100',
                                isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-white border-slate-100 text-slate-300'
                            )}>
                                {isCompleted ? (
                                    <CheckCircle2 size={16} strokeWidth={3} />
                                ) : (
                                    <Circle size={10} fill="currentColor" />
                                )}
                                {isCurrent && (
                                    <motion.div 
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 bg-emerald-500 rounded-full"
                                    />
                                )}
                            </div>
                            <div className="flex-1 flex justify-between items-center">
                                <span className={cn(
                                    'text-sm font-bold uppercase tracking-widest transition-colors',
                                    isCompleted ? 'text-navy' : 'text-slate-300'
                                )}>
                                    {step.label}
                                </span>
                                <span className="text-[10px] font-black text-slate-300">{step.time}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Order Items Summary */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Order Summary</h3>
            <div className="space-y-4">
                {order.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm font-bold text-slate-500">
                        <span className="truncate pr-4 flex items-center gap-2">
                            <span className="w-5 font-black text-navy">1x</span> {item.itemName}
                        </span>
                        <span className="font-extrabold text-navy whitespace-nowrap">{formatPrice(item.lineTotal)}</span>
                    </div>
                ))}
            </div>
            <div className="mt-8 pt-6 border-t border-dashed border-slate-100 flex justify-between items-center">
                <span className="text-base font-black text-navy uppercase tracking-widest">Total Paid</span>
                <span className="text-xl font-black text-primary tracking-tight">{formatPrice(order.grandTotal)}</span>
            </div>
        </div>

        {/* Help Actions */}
        <div className="grid grid-cols-2 gap-3 pt-4">
            <button className="h-16 bg-white border border-slate-100 rounded-[24px] flex items-center justify-center gap-3 text-navy font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                    <Phone size={18} strokeWidth={2.5} />
                </div>
                Support
            </button>
            <button 
                onClick={() => router.push('/user')}
                className="h-16 bg-navy text-white rounded-[24px] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-200 active:scale-[0.98] transition-all"
            >
                <div className="p-2 bg-white/10 text-white rounded-xl">
                    <MessageSquare size={18} strokeWidth={2.5} />
                </div>
                Message
            </button>
        </div>
      </main>
    </div>
  );
}
