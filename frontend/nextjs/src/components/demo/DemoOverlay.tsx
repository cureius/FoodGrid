"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useDemo } from '@/contexts/DemoContext';
import { DemoHint } from '@/constants/demo';
import { Info, ArrowRight, X } from 'lucide-react';

export default function DemoOverlay() {
  const { isActive, currentHint, hideHint } = useDemo();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Update target rect when currentHint changes or window resizes
  useEffect(() => {
    if (!currentHint) {
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(`[data-demo-anchor="${currentHint.anchor}"]`);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      } else {
        // Retry for a bit in case of dynamic loading
        const interval = setInterval(() => {
          const el = document.querySelector(`[data-demo-anchor="${currentHint.anchor}"]`);
          if (el) {
            setTargetRect(el.getBoundingClientRect());
            clearInterval(interval);
          }
        }, 500);
        
        // Timeout after 5s
        setTimeout(() => clearInterval(interval), 5000);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [currentHint]);

  if (!mounted || !isActive || !currentHint || !targetRect) return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }}>
      {/* Dimmed Background with Hole (using clip-path or heavy optimization) 
          For simplicity, we use 4 divs to create the frame around the target 
      */}
      <div style={{ // Top
        position: 'absolute', top: 0, left: 0, right: 0, height: targetRect.top,
        background: 'rgba(0, 0, 0, 0.5)', pointerEvents: 'auto'
      }} />
      <div style={{ // Bottom
        position: 'absolute', top: targetRect.bottom, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)', pointerEvents: 'auto'
      }} />
      <div style={{ // Left
        position: 'absolute', top: targetRect.top, left: 0, width: targetRect.left, height: targetRect.height,
        background: 'rgba(0, 0, 0, 0.5)', pointerEvents: 'auto'
      }} />
      <div style={{ // Right
        position: 'absolute', top: targetRect.top, left: targetRect.right, right: 0, height: targetRect.height,
        background: 'rgba(0, 0, 0, 0.5)', pointerEvents: 'auto'
      }} />

      {/* Spotlight Border */}
      <div style={{
        position: 'absolute',
        top: targetRect.top - 4,
        left: targetRect.left - 4,
        width: targetRect.width + 8,
        height: targetRect.height + 8,
        border: '2px solid #3b82f6',
        borderRadius: 4,
        boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3)',
        pointerEvents: 'none',
        transition: 'all 0.3s ease-out'
      }} />

      {/* Hint Card */}
      <HintCard hint={currentHint} targetRect={targetRect} onDismiss={hideHint} />
    </div>,
    document.body
  );
}

function HintCard({ hint, targetRect, onDismiss }: { hint: DemoHint, targetRect: DOMRect, onDismiss: () => void }) {
  // Simple positioning logic
  const spacing = 16;
  let top = targetRect.bottom + spacing;
  let left = targetRect.left;
  const cardWidth = 320;

  // Adjust if going off screen
  if (left + cardWidth > window.innerWidth) {
    left = window.innerWidth - cardWidth - spacing;
  }
  
  if (top + 150 > window.innerHeight) {
    top = targetRect.top - 150 - spacing; // Flip to top
  }

  return (
    <div style={{
      position: 'absolute',
      top,
      left,
      width: cardWidth,
      background: 'white',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      pointerEvents: 'auto',
      animation: 'fadeIn 0.3s ease-out',
      color: '#1e293b'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#eff6ff', padding: 4, borderRadius: 6, color: '#3b82f6' }}>
            <Info size={16} />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{hint.title}</h3>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
          <X size={16} />
        </button>
      </div>
      
      {hint.description && (
        <p style={{ margin: '0 0 16px 0', fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>
          {hint.description}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
          Waiting for action...
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
