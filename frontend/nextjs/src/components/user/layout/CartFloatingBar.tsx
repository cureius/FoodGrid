'use client';

import { useRouter } from 'next/navigation';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/stores/cart';
import { formatPrice } from '@/lib/api/customer';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartFloatingBar() {
  const router = useRouter();
  const { itemCount, subtotal } = useCartStore();

  if (itemCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="floating-bar-root"
      >
        <button
          onClick={() => router.push('/user/cart')}
          className="cart-btn"
        >
          <div className="btn-left">
            <div className="icon-box">
              <ShoppingBag size={20} />
            </div>
            <div className="info">
              <span className="count">{itemCount} {itemCount === 1 ? 'Item' : 'Items'}</span>
              <span className="price">{formatPrice(subtotal)}</span>
            </div>
          </div>

          <div className="btn-right">
            <span>View Cart</span>
            <ChevronRight size={18} strokeWidth={3} />
          </div>

          <motion.div 
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="shimmer"
          />
        </button>

        <style jsx>{`
            .floating-bar-root { position: fixed; bottom: 84px; left: 0; right: 0; z-index: 40; padding: 0 16px; }
            .cart-btn { max-width: 418px; margin: 0 auto; width: 100%; background: var(--primary); color: white; height: 56px; border-radius: 16px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 12px 32px rgba(75, 112, 245, 0.3); overflow: hidden; position: relative; }
            .cart-btn:active { transform: scale(0.98); }
            
            .btn-left { display: flex; align-items: center; gap: 12px; }
            .icon-box { background: rgba(255, 255, 255, 0.2); width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
            .info { display: flex; flex-direction: column; align-items: flex-start; }
            .count { font-size: 10px; font-weight: 800; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px; }
            .price { font-size: 16px; font-weight: 800; }

            .btn-right { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }

            .shimmer { position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent); pointer-events: none; }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
