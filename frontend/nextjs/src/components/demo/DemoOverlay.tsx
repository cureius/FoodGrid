'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useDemo } from '@/contexts/DemoContext';

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function DemoOverlay() {
  const { currentStep, advanceFlow, currentStepIndex, flow, flowStarted } = useDemo();
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const observerRef = useRef<MutationObserver | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!flowStarted || !currentStep) {
      setTargetRect(null);
      return;
    }

    if (!currentStep.targetAction) {
      setTargetRect(null);
      return;
    }

    function findTarget() {
      const el = document.querySelector(`[data-demo-action="${currentStep!.targetAction}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });

        // Position tooltip below the target
        const tooltipWidth = 320;
        let tLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
        tLeft = Math.max(16, Math.min(tLeft, window.innerWidth - tooltipWidth - 16));
        let tTop = rect.bottom + 16;
        if (tTop + 200 > window.innerHeight) {
          tTop = rect.top - 200 - 16 + window.scrollY;
        } else {
          tTop += window.scrollY;
        }
        setTooltipPos({ top: tTop, left: tLeft });

        // Scroll into view if needed
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    findTarget();

    // Poll for element appearance
    pollRef.current = setInterval(findTarget, 500);

    // Also observe DOM mutations
    observerRef.current = new MutationObserver(findTarget);
    observerRef.current.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [currentStep, flowStarted]);

  if (!flowStarted || !currentStep) return null;

  const isLastStep = currentStepIndex === flow.length - 1;
  const hasCompletionEvent = !!currentStep.completionEvent;
  const progress = ((currentStepIndex + 1) / flow.length) * 100;

  return (
    <>
      {/* Backdrop with spotlight cutout */}
      {targetRect && (
        <svg
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9998,
            pointerEvents: 'none',
          }}
        >
          <defs>
            <mask id="demo-spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - window.scrollX - 8}
                y={targetRect.top - window.scrollY - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.5)"
            mask="url(#demo-spotlight-mask)"
          />
        </svg>
      )}

      {/* Target highlight ring */}
      {targetRect && (
        <div
          style={{
            position: 'absolute',
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            border: '2px solid #10b981',
            borderRadius: 8,
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.3)',
            animation: 'demo-pulse 2s infinite',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        style={{
          position: targetRect ? 'absolute' : 'fixed',
          top: targetRect ? tooltipPos.top : '50%',
          left: targetRect ? tooltipPos.left : '50%',
          transform: targetRect ? 'none' : 'translate(-50%, -50%)',
          width: 320,
          background: '#1e293b',
          color: 'white',
          borderRadius: 12,
          padding: 20,
          zIndex: 10000,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            Step {currentStepIndex + 1} of {flow.length}
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 999,
            background: currentStep.role === 'staff' ? '#3b82f6' : currentStep.role === 'admin' ? '#8b5cf6' : '#10b981',
            color: 'white',
            textTransform: 'uppercase',
          }}>
            {currentStep.role}
          </span>
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>
          {currentStep.title}
        </h3>
        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, marginBottom: 16 }}>
          {currentStep.description}
        </p>

        {/* Progress bar */}
        <div style={{ height: 3, background: '#334155', borderRadius: 2, marginBottom: 12 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#10b981', borderRadius: 2, transition: 'width 0.3s' }} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {hasCompletionEvent ? (
            <span style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
              Perform the action to continue...
            </span>
          ) : isLastStep ? (
            <a
              href="/start-free-trial"
              style={{
                padding: '8px 16px',
                background: '#10b981',
                color: 'white',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              Start Free Trial
            </a>
          ) : (
            <button
              onClick={advanceFlow}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Next
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes demo-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3); }
          50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.1); }
        }
      `}</style>
    </>
  );
}
