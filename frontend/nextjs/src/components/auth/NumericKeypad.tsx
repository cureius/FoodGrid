"use client";

import type React from "react";

export default function NumericKeypad(props: {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}) {
  const { onDigit, onBackspace, disabled } = props;
  const btnStyle: React.CSSProperties = {
    padding: "20px 0",
    borderRadius: "var(--radius-md)",
    background: "transparent",
    fontSize: 28,
    fontWeight: 600,
    color: "var(--text-main)",
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px 40px",
    maxWidth: 320,
    margin: "0 auto",
  };

  return (
    <div style={gridStyle}>
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
        <button 
          key={d} 
          onClick={() => onDigit(d)} 
          disabled={disabled} 
          style={btnStyle}
          className="keypad-btn"
        >
          {d}
        </button>
      ))}
      <div />
      <button 
        onClick={() => onDigit("0")} 
        disabled={disabled} 
        style={btnStyle}
        className="keypad-btn"
      >
        0
      </button>
      <button 
        onClick={onBackspace} 
        disabled={disabled} 
        style={btnStyle}
        className="keypad-btn"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
          <line x1="18" y1="9" x2="12" y2="15"></line>
          <line x1="12" y1="9" x2="18" y2="15"></line>
        </svg>
      </button>
    </div>
  );
}
