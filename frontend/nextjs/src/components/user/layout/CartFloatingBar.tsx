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
        className="floating-cart-wrapper"
      >
        <button
          onClick={() => router.push('/user/cart')}
          className="floating-cart-btn"
        >
          <div className="cart-info">
            <div className="cart-icon">
              <ShoppingBag size={20} />
            </div>
            <div className="cart-text">
              <span className="item-count">
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
              </span>
              <span className="subtotal">
                {formatPrice(subtotal)}
                <span className="tax-note">+ taxes</span>
              </span>
            </div>
          </div>

          <div className="view-cart">
            <span>View Cart</span>
            <ChevronRight size={18} />
          </div>

          <div className="shimmer-effect" />
        </button>

        <style jsx>{`
          .floating-cart-wrapper {
            position: fixed;
            bottom: 80px;
            left: 0;
            right: 0;
            z-index: 40;
            padding: 0 16px;
          }
          @media (min-width: 768px) {
            .floating-cart-wrapper {
              bottom: 24px;
            }
          }
          .floating-cart-wrapper :global(button) {
            max-width: 418px; /* max-width of container minus padding */
            margin: 0 auto;
            width: 100%;
            background: var(--primary);
            color: white;
            height: 56px;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-premium);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            position: relative;
            overflow: hidden;
            border: none;
            cursor: pointer;
          }
          .cart-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .cart-icon {
            background: rgba(255, 255, 255, 0.2);
            padding: 8px;
            border-radius: 10px;
            display: flex;
          }
          .cart-text {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            line-height: 1;
          }
          .item-count {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.9;
            margin-bottom: 4px;
          }
          .subtotal {
            font-size: 18px;
            font-weight: 800;
          }
          .tax-note {
            font-size: 9px;
            font-weight: 400;
            opacity: 0.7;
            margin-left: 4px;
          }
          .view-cart {
            display: flex;
            align-items: center;
            gap: 4px;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 13px;
            letter-spacing: 0.5px;
          }
          .shimmer-effect {
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
            transform: translateX(-100%);
            animation: shimmerSlide 2s infinite;
          }
          @keyframes shimmerSlide {
            100% { transform: translateX(100%); }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
