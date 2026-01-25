'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getImageUrl, formatPrice, MenuItem } from '@/lib/api/customer';
import { useCartStore } from '@/stores/cart';
import VegIndicator from '@/components/user/ui/VegIndicator';
import QuantityControl from '@/components/user/ui/QuantityControl';
import DishModal from '@/components/user/menu/DishModal';
import { Plus, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface DishCardProps {
  item: MenuItem;
}

export default function DishCard({ item }: DishCardProps) {
  const { addItem, updateQuantity, getItemQuantity } = useCartStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const quantity = getItemQuantity(item.id);

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        onClick={() => setIsModalOpen(true)}
        className="dish-card"
      >
        <div className="dish-info">
          <div className="dish-indicators">
            <VegIndicator isVeg={item.isVeg} />
            {item.isBestseller && (
              <span className="bestseller-badge">
                <Star size={10} fill="currentColor" /> Bestseller
              </span>
            )}
          </div>
          <h3 className="dish-name">
            {item.name}
          </h3>
          <p className="dish-price">
            {formatPrice(item.basePrice)}
          </p>
          <p className="dish-description">
            {item.description || 'Deliciously prepared with fresh ingredients and our signature flavors.'}
          </p>
        </div>

        <div className="dish-image-wrapper" onClick={(e) => e.stopPropagation()}>
          <div className="image-container">
            {item.primaryImageUrl ? (
              <Image
                src={getImageUrl(item.primaryImageUrl)!}
                alt={item.name}
                fill
                className="dish-image"
                sizes="128px"
              />
            ) : (
              <div className="placeholder-image">
                <Image 
                  src="/res/burger_placeholder.png" 
                  alt="placeholder" 
                  width={64} 
                  height={64} 
                  className="placeholder-icon"
                />
              </div>
            )}
          </div>

          <div className="add-btn-wrapper">
            {quantity > 0 ? (
              <QuantityControl
                quantity={quantity}
                onIncrease={() => addItem(item, 1)}
                onDecrease={() => updateQuantity(useCartStore.getState().findExistingItem(item.id)?.id!, quantity - 1)}
                size="md"
              />
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addItem(item, 1);
                }}
                className="add-button"
              >
                ADD
                <Plus size={14} strokeWidth={3} className="plus-icon" />
              </button>
            )}
            <span className="customizable-text">Customizable</span>
          </div>
        </div>

        <style jsx>{`
          .dish-card {
            display: flex;
            gap: 16px;
            padding: 16px 0;
            cursor: pointer;
            transition: var(--transition-normal);
          }
          .dish-info {
            flex: 1;
          }
          .dish-indicators {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
          }
          .bestseller-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 10px;
            background: rgba(246, 155, 66, 0.1);
            color: var(--secondary);
            font-weight: 800;
            padding: 2px 6px;
            border-radius: 4px;
            margin-left: 8px;
            text-transform: uppercase;
          }
          .dish-name {
            font-size: 18px;
            font-weight: 800;
            margin-bottom: 2px;
            line-height: 1.2;
            transition: var(--transition-fast);
          }
          .dish-card:hover .dish-name {
            color: var(--primary);
          }
          .dish-price {
            font-weight: 800;
            font-size: 14px;
            color: var(--text-main);
            margin-bottom: 8px;
          }
          .dish-description {
            font-size: 12px;
            color: var(--text-muted);
            line-height: 1.6;
            font-weight: 500;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .dish-image-wrapper {
            position: relative;
            flex-shrink: 0;
          }
          .image-container {
            position: relative;
            width: 128px;
            height: 128px;
            border-radius: var(--radius-lg);
            overflow: hidden;
            border: 1px solid var(--border-light);
            box-shadow: var(--shadow-sm);
          }
          .dish-image {
            object-fit: cover;
            transition: transform 0.5s ease;
          }
          .dish-card:hover .dish-image {
            transform: scale(1.1);
          }
          .placeholder-image {
            width: 100%;
            height: 100%;
            background: var(--bg-muted);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .placeholder-icon {
            opacity: 0.1;
            filter: grayscale(1);
          }
          .add-btn-wrapper {
            position: absolute;
            bottom: -12px;
            left: 50%;
            transform: translateX(-50%);
            width: 112px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .add-button {
            width: 100%;
            height: 36px;
            background: white;
            border: 1px solid rgba(75, 112, 245, 0.2);
            border-radius: var(--radius-sm);
            color: var(--primary);
            font-weight: 800;
            font-size: 14px;
            box-shadow: var(--shadow-md);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            transition: var(--transition-fast);
          }
          .add-button:hover {
            transform: scale(1.05);
            background: var(--primary-light);
          }
          .plus-icon {
            transition: transform 0.3s ease;
          }
          .add-button:hover .plus-icon {
            transform: rotate(90deg);
          }
          .customizable-text {
            font-size: 9px;
            color: var(--text-light);
            font-weight: 600;
            margin-top: 4px;
            text-align: center;
          }
        `}</style>
      </motion.div>

      <DishModal 
        item={item} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
