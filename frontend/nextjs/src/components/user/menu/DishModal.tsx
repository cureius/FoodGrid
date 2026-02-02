'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChefHat, Info } from 'lucide-react';
import Image from 'next/image';
import { MenuItem, getImageUrl, formatPrice } from '@/lib/api/customer';
import { useCartStore } from '@/stores/cart';
import VegIndicator from '@/components/user/ui/VegIndicator';
import QuantityControl from '@/components/user/ui/QuantityControl';

interface DishModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DishModal({ item, isOpen, onClose }: DishModalProps) {
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      setQuantity(1);
      setInstructions('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted) return null;

  const handleAddToCart = () => {
    if (item) {
      addItem(item, quantity, [], [], instructions);
      onClose();
    }
  };

  // If not open and no item, we still render the Portal/AnimatePresence shell 
  // to allow exit animations to complete if needed.

  return createPortal(
    <AnimatePresence>
      {isOpen && item && (
        <div className="modal-root">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="modal-backdrop"
          />

          <div className="modal-wrapper">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
              className="modal-content"
            >
              {/* Header Image Section */}
              <div className="modal-image-wrapper">
                {item.primaryImageUrl ? (
                    <Image 
                      src={getImageUrl(item.primaryImageUrl)!} 
                      alt={item.name} 
                      fill 
                      className="modal-image" 
                      priority
                    />
                ) : (
                    <div className="modal-image-placeholder">
                      <ChefHat size={64} className="placeholder-icon" />
                    </div>
                )}
                <div className="modal-image-overlay" />
                <button 
                  onClick={onClose}
                  className="modal-close-btn"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Main Content Area */}
              <div className="modal-body">
                <div className="modal-header">
                    <div className="modal-title-row">
                        <div className="indicator-wrapper">
                          <VegIndicator isVeg={item.isVeg} size="md" showText />
                        </div>
                        <h2 className="modal-title">{item.name}</h2>
                    </div>
                    <div className="modal-price-wrapper">
                        <span className="modal-price">{formatPrice(item.basePrice)}</span>
                        {item.isBestseller && (
                            <span className="modal-bestseller">BESTSELLER</span>
                        )}
                    </div>
                </div>

                <div className="description-box">
                  <Info size={16} className="info-icon" />
                  <p className="modal-description">
                    {item.description || 'Our chef\'s special preparation using the finest seasonal ingredients and traditional recipes.'}
                  </p>
                </div>

                <div className="modal-form">
                    <label className="form-group-label" htmlFor="instructions">
                        <span className="form-label-text">Cooking Instructions</span>
                        <span className="form-optional-badge">OPTIONAL</span>
                    </label>
                    <textarea 
                        id="instructions"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Add notes (e.g. less spicy, no onions...)"
                        className="form-textarea"
                    />
                </div>

                {/* Bottom Spacer for Sticky Footer */}
                <div className="modal-footer-spacer" />
              </div>

              {/* Action Footer */}
              <div className="modal-footer">
                  <div className="qty-picker">
                      <QuantityControl 
                          quantity={quantity}
                          onIncrease={() => setQuantity(q => q + 1)}
                          onDecrease={() => setQuantity(q => Math.max(1, q - 1))}
                          size="lg"
                      />
                  </div>
                  <button 
                      onClick={handleAddToCart}
                      className="modal-add-btn"
                  >
                      <span className="add-btn-text">Add to Cart</span>
                      <span className="add-btn-divider" />
                      <span className="add-btn-price">{formatPrice(item.basePrice * quantity)}</span>
                  </button>
              </div>
            </motion.div>
          </div>

          <style jsx>{`
            .modal-root {
              position: fixed;
              inset: 0;
              z-index: 99999;
              display: flex;
              align-items: center;
              justify-content: center;
              pointer-events: auto;
            }
            .modal-backdrop {
              position: absolute;
              inset: 0;
              background-color: rgba(0, 0, 0, 0.7);
              backdrop-filter: blur(12px);
              -webkit-backdrop-filter: blur(12px);
              cursor: pointer;
            }
            .modal-wrapper {
              position: relative;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: flex-end;
              justify-content: center;
              padding: 0;
              pointer-events: none; /* Allow clicks to pass to backdrop outside content */
            }
            @media (min-width: 768px) {
              .modal-wrapper {
                 align-items: center;
                 padding: 24px;
              }
            }
            .modal-content {
              background-color: #ffffff;
              width: 100%;
              max-width: 480px;
              border-radius: 32px 32px 0 0;
              overflow: hidden;
              pointer-events: auto; /* Re-enable clicks for modal content */
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
              max-height: 94vh;
              display: flex;
              flex-direction: column;
              position: relative;
              border: 1px solid rgba(255, 255, 255, 0.1);
            }
            @media (min-width: 768px) {
              .modal-content {
                border-radius: 32px;
                max-height: 85vh;
              }
            }
            .modal-image-wrapper {
              position: relative;
              height: 300px;
              width: 100%;
              flex-shrink: 0;
              background-color: #f1f3f5;
            }
            .modal-image {
              object-fit: cover;
            }
            .modal-image-placeholder {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: #e9ecef;
            }
            .placeholder-icon {
              color: rgba(0,0,0,0.05);
            }
            .modal-image-overlay {
              position: absolute;
              inset: 0;
              background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6));
            }
            .modal-close-btn {
              position: absolute;
              top: 24px;
              right: 24px;
              background: rgba(255, 255, 255, 0.95);
              color: #000;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 10px 20px rgba(0,0,0,0.15);
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              border: none;
              cursor: pointer;
            }
            .modal-close-btn:hover {
              transform: scale(1.1) rotate(90deg);
              background-color: #ffffff;
            }
            .modal-body {
              padding: 28px;
              overflow-y: auto;
              flex: 1;
              scrollbar-width: thin;
              background-color: #ffffff;
            }
            .modal-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 24px;
            }
            .modal-title-row { flex: 1; padding-right: 20px; }
            .indicator-wrapper { margin-bottom: 10px; }
            .modal-title {
              font-size: 28px;
              font-weight: 850;
              line-height: 1.1;
              color: #111111;
              letter-spacing: -0.03em;
            }
            .modal-price-wrapper {
              text-align: right;
            }
            .modal-price {
              display: block;
              font-size: 24px;
              font-weight: 800;
              color: var(--primary, #4B70F5);
            }
            .modal-bestseller {
              display: inline-block;
              background: #FFF5E6;
              color: #F69B42;
              font-size: 11px;
              font-weight: 900;
              padding: 5px 12px;
              border-radius: 8px;
              margin-top: 8px;
              border: 1px solid rgba(246, 155, 66, 0.2);
            }
            .description-box {
              display: flex;
              gap: 14px;
              background-color: var(--bg-secondary);
              padding: 20px;
              border-radius: 20px;
              margin-bottom: 32px;
              border: 1px solid var(--bg-tertiary);
            }
            .info-icon {
              color: var(--text-tertiary);
              flex-shrink: 0;
              margin-top: 2px;
            }
            .modal-description {
              color: #475569;
              font-size: 15px;
              line-height: 1.6;
              font-weight: 500;
            }
            .modal-form {
              margin-bottom: 32px;
            }
            .form-group-label {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 14px;
              cursor: pointer;
            }
            .form-label-text {
              font-size: 15px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: var(--text-primary);
            }
            .form-optional-badge {
              font-size: 10px;
              font-weight: 800;
              color: var(--text-tertiary);
              background-color: var(--bg-tertiary);
              padding: 4px 8px;
              border-radius: 6px;
            }
            .form-textarea {
              width: 100%;
              background-color: var(--bg-secondary);
              border: 2px solid var(--bg-tertiary);
              border-radius: 16px;
              padding: 20px;
              font-size: 15px;
              min-height: 120px;
              font-family: inherit;
              resize: none;
              outline: none;
              transition: all 0.2s ease;
              font-weight: 500;
              color: var(--text-primary);
            }
            .form-textarea:focus {
              border-color: var(--primary, #4B70F5);
              background-color: #ffffff;
              box-shadow: 0 10px 25px rgba(75, 112, 245, 0.08);
            }
            .modal-footer-spacer { height: 100px; }
            .modal-footer {
              display: flex;
              align-items: center;
              gap: 20px;
              padding: 24px 32px;
              background-color: #ffffff;
              border-top: 1px solid var(--bg-tertiary);
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              box-shadow: 0 -10px 30px rgba(0,0,0,0.03);
            }
            .qty-picker {
              width: 150px;
            }
            .modal-add-btn {
              flex: 1;
              background: var(--primary, #4B70F5);
              color: #ffffff;
              height: 60px;
              border-radius: 20px;
              font-weight: 800;
              font-size: 16px;
              box-shadow: 0 12px 28px rgba(75, 112, 245, 0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              border: none;
              padding: 0 24px;
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .modal-add-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 15px 35px rgba(75, 112, 245, 0.4);
              filter: brightness(1.05);
            }
            .modal-add-btn:active {
              transform: translateY(0);
            }
            .add-btn-text { flex: 1; text-align: left; }
            .add-btn-divider {
              width: 1px;
              height: 24px;
              background: rgba(255,255,255,0.3);
              margin: 0 20px;
            }
            .add-btn-price { font-variant-numeric: tabular-nums; }
          `}</style>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
