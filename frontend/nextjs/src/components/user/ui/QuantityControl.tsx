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
  return (
    <div className={`qty-control ${size} ${loading ? 'loading' : ''}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDecrease();
        }}
        disabled={loading}
        className="qty-btn minus"
      >
        {quantity === 1 && showDelete ? (
          <Trash2 size={size === 'lg' ? 18 : 14} className="icon-delete" />
        ) : (
          <Minus size={size === 'lg' ? 18 : 14} strokeWidth={3} />
        )}
      </button>

      <span className="qty-value">
        {loading ? <div className="spinner" /> : quantity}
      </span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onIncrease();
        }}
        disabled={loading}
        className="qty-btn plus"
      >
        <Plus size={size === 'lg' ? 18 : 14} strokeWidth={3} />
      </button>

      <style jsx>{`
        .qty-control {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(75, 112, 245, 0.05);
          border: 1px solid rgba(75, 112, 245, 0.2);
          border-radius: var(--radius-sm);
          color: var(--primary);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          transition: var(--transition-fast);
        }
        .qty-control:hover {
          background: rgba(75, 112, 245, 0.08);
        }
        
        /* Sizes */
        .sm { height: 28px; min-width: 70px; font-size: 12px; }
        .md { height: 36px; min-width: 90px; font-size: 14px; }
        .lg { height: 44px; min-width: 110px; font-size: 16px; }

        .qty-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 0 8px;
          color: inherit;
        }
        .qty-btn:hover {
          background: rgba(75, 112, 245, 0.1);
        }
        .qty-btn:active {
          transform: scale(0.9);
        }
        .qty-value {
          font-weight: 800;
          min-width: 1.2rem;
          text-align: center;
        }
        .icon-delete {
          color: var(--danger);
        }
        .spinner {
          width: 12px;
          height: 12px;
          border: 2px solid var(--primary);
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
