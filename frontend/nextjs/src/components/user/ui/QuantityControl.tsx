'use client';

import { Plus, Minus, Trash2 } from 'lucide-react';

interface QuantityControlProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  showDelete?: boolean;
}

export default function QuantityControl({
  quantity,
  onIncrease,
  onDecrease,
  size = 'md',
  loading = false,
  showDelete = false,
}: QuantityControlProps) {
  const iconSize = size === 'lg' ? 18 : 14;

  return (
    <div className={`qty-ctrl ${size} ${loading ? 'loading' : ''}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDecrease();
        }}
        disabled={loading}
        className="ctrl-btn"
      >
        {quantity === 1 && showDelete ? (
          <Trash2 size={iconSize} className="delete-icon" />
        ) : (
          <Minus size={iconSize} strokeWidth={3} />
        )}
      </button>

      <span className="qty-val">
        {loading ? <div className="spinner" /> : quantity}
      </span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onIncrease();
        }}
        disabled={loading}
        className="ctrl-btn"
      >
        <Plus size={iconSize} strokeWidth={3} />
      </button>

      <style jsx>{`
        .qty-ctrl { display: flex; align-items: center; justify-content: space-between; background: var(--primary-light); border: 1px solid rgba(75, 112, 245, 0.2); border-radius: 8px; color: var(--primary); overflow: hidden; box-shadow: var(--shadow-sm); transition: var(--transition-fast); }
        .qty-ctrl.loading { opacity: 0.7; pointer-events: none; }
        
        .qty-ctrl.sm { height: 28px; min-width: 70px; font-size: 12px; }
        .qty-ctrl.md { height: 36px; min-width: 90px; font-size: 14px; }
        .qty-ctrl.lg { height: 44px; min-width: 110px; font-size: 16px; }

        .ctrl-btn { height: 100%; padding: 0 8px; display: flex; align-items: center; justify-content: center; color: inherit; transition: var(--transition-fast); }
        .ctrl-btn:hover { background: rgba(75, 112, 245, 0.05); }
        .ctrl-btn:active { transform: scale(0.9); }
        .delete-icon { color: var(--danger); }

        .qty-val { flex: 1; text-align: center; font-weight: 800; min-width: 20px; }
        
        .spinner { width: 12px; height: 12px; border: 2px solid var(--primary); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
