'use client';

import React from 'react';

interface VegIndicatorProps {
  isVeg: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function VegIndicator({ isVeg, size = 'sm', showText = false }: VegIndicatorProps) {
  const sizeMap = {
    sm: { box: 12, dot: 4, font: 10 },
    md: { box: 16, dot: 6, font: 12 },
    lg: { box: 20, dot: 8, font: 14 }
  };

  const { box, dot, font } = sizeMap[size];
  const color = isVeg ? 'var(--success)' : '#D9534F';

  return (
    <div className="veg-wrap">
      <div className="veg-box">
        <div className="veg-dot" />
      </div>
      {showText && (
        <span className="veg-text">
          {isVeg ? 'Veg' : 'Non-Veg'}
        </span>
      )}
      <style jsx>{`
        .veg-wrap { display: flex; align-items: center; gap: 6px; }
        .veg-box {
          display: flex; align-items: center; justify-content: center;
          width: ${box}px; height: ${box}px;
          border: 1.5px solid ${color};
          border-radius: 2px; background: white;
          padding: 2px;
        }
        .veg-dot {
          width: ${dot}px; height: ${dot}px;
          border-radius: 50%; background: ${color};
        }
        .veg-text {
          font-size: ${font}px; font-weight: 800;
          color: ${color};
        }
      `}</style>
    </div>
  );
}
