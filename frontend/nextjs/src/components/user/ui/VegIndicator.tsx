'use client';

import React from 'react';

interface VegIndicatorProps {
  isVeg: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function VegIndicator({ isVeg, size = 'sm', showText = false }: VegIndicatorProps) {
  return (
    <div className={`veg-indicator-container ${size} ${isVeg ? 'veg' : 'non-veg'}`}>
      <div className="outer-box">
        <div className="inner-dot" />
      </div>
      {showText && (
        <span className="veg-text">
          {isVeg ? 'Veg' : 'Non-Veg'}
        </span>
      )}

      <style jsx>{`
        .veg-indicator-container {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .outer-box {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
          background: white;
          border: 1.5px solid transparent;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .inner-dot {
          border-radius: 50%;
        }

        /* Sizes */
        .sm .outer-box { width: 12px; height: 12px; padding: 2px; }
        .sm .inner-dot { width: 4px; height: 4px; }
        .sm .veg-text { font-size: 10px; }

        .md .outer-box { width: 16px; height: 16px; padding: 3px; border-width: 2px; }
        .md .inner-dot { width: 6px; height: 6px; }
        .md .veg-text { font-size: 12px; }

        .lg .outer-box { width: 20px; height: 20px; padding: 4px; border-width: 2px; }
        .lg .inner-dot { width: 8px; height: 8px; }
        .lg .veg-text { font-size: 14px; }

        /* Types */
        .veg .outer-box { border-color: var(--success); }
        .veg .inner-dot { background: var(--success); }
        .veg .veg-text { color: var(--success); font-weight: 700; }

        .non-veg .outer-box { border-color: #D9534F; }
        .non-veg .inner-dot { background: #D9534F; }
        .non-veg .veg-text { color: #D9534F; font-weight: 700; }
      `}</style>
    </div>
  );
}
