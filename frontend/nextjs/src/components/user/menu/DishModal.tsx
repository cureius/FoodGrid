'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
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

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setInstructions('');
    }
  }, [isOpen]);

  if (!item) return null;

  const handleAddToCart = () => {
    addItem(item, quantity, [], [], instructions);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="modal-backdrop"
          />

          <div className="modal-container">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="modal-content"
            >
              <div className="modal-image-wrapper">
                {item.primaryImageUrl ? (
                    <Image src={getImageUrl(item.primaryImageUrl)!} alt={item.name} fill className="modal-image" />
                ) : (
                    <div className="modal-image-placeholder" />
                )}
                <button 
                  onClick={onClose}
                  className="modal-close-btn"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-header">
                    <div className="modal-title-row">
                        <VegIndicator isVeg={item.isVeg} size="md" showText />
                        <h2 className="modal-title">{item.name}</h2>
                    </div>
                    <div className="modal-price-wrapper">
                        <span className="modal-price">{formatPrice(item.basePrice)}</span>
                        {item.isBestseller && (
                            <span className="modal-bestseller">BESTSELLER</span>
                        )}
                    </div>
                </div>

                <p className="modal-description">
                  {item.description || 'Our chef\'s special preparation using the finest seasonal ingredients and traditional recipes.'}
                </p>

                <div className="modal-form">
                    <div className="form-group">
                        <div className="form-label-row">
                            <h3 className="form-label">Cooking Instructions</h3>
                            <span className="form-optional">OPTIONAL</span>
                        </div>
                        <textarea 
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Add notes (e.g. less spicy, no onions...)"
                            className="form-textarea"
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <div className="qty-wrapper">
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
                        ADD TO CART — {formatPrice(item.basePrice * quantity)}
                    </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 60;
        }
        .modal-container {
          position: fixed;
          inset: 0;
          z-index: 70;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          pointer-events: none;
        }
        .modal-content {
          background: white;
          width: 100%;
          max-width: 450px;
          border-radius: 24px 24px 0 0;
          overflow: hidden;
          pointer-events: auto;
          box-shadow: var(--shadow-premium);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }
        .modal-image-wrapper {
          position: relative;
          height: 256px;
          width: 100%;
          flex-shrink: 0;
        }
        .modal-image {
          object-fit: cover;
        }
        .modal-image-placeholder {
          width: 100%;
          height: 100%;
          background: var(--bg-muted);
        }
        .modal-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(0, 0, 0, 0.4);
          color: white;
          padding: 8px;
          border-radius: 50%;
          backdrop-filter: blur(8px);
        }
        .modal-close-btn:hover {
          background: rgba(0, 0, 0, 0.6);
        }
        .modal-body {
          padding: 24px;
          overflow-y: auto;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .modal-title-row { flex: 1; padding-right: 16px; }
        .modal-title {
          font-size: 24px;
          font-weight: 800;
          margin-top: 8px;
          line-height: 1.1;
          color: var(--navy);
        }
        .modal-price-wrapper {
          text-align: right;
        }
        .modal-price {
          display: block;
          font-size: 20px;
          font-weight: 800;
          color: var(--primary);
        }
        .modal-bestseller {
          display: inline-block;
          background: rgba(246, 155, 66, 0.1);
          color: var(--secondary);
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 999px;
          margin-top: 4px;
        }
        .modal-description {
          color: var(--text-muted);
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 32px;
          font-weight: 500;
        }
        .modal-form {
          margin-bottom: 32px;
        }
        .form-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .form-label {
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--navy);
        }
        .form-optional {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-light);
        }
        .form-textarea {
          width: 100%;
          background: var(--bg-muted);
          border: none;
          border-radius: var(--radius-md);
          padding: 16px;
          font-size: 14px;
          min-height: 100px;
          font-family: inherit;
          resize: none;
          outline: none;
          transition: var(--transition-fast);
          font-weight: 600;
        }
        .form-textarea:focus {
          box-shadow: 0 0 0 2px rgba(75, 112, 245, 0.1);
          background: white;
        }
        .modal-footer {
          display: flex;
          align-items: center;
          gap: 16px;
          position: sticky;
          bottom: 0;
          background: white;
          padding-top: 12px;
        }
        .qty-wrapper {
          width: 128px;
        }
        .modal-add-btn {
          flex: 1;
          background: var(--primary);
          color: white;
          height: 52px;
          border-radius: var(--radius-md);
          font-weight: 800;
          font-size: 14px;
          box-shadow: 0 8px 24px rgba(75, 112, 245, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-add-btn:active {
          transform: scale(0.98);
        }
      `}</style>
    </AnimatePresence>
  );
}
