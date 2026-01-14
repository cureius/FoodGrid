"use client";

import type React from "react";

export default function NumericKeypad(props: {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}) {
  const { onDigit, onBackspace, disabled } = props;
  const btnStyle: React.CSSProperties = {
    padding: "14px 0",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "white",
    fontSize: 18
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10
  };

  return (
    <div style={gridStyle}>
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
        <button key={d} onClick={() => onDigit(d)} disabled={disabled} style={btnStyle}>
          {d}
        </button>
      ))}
      <div />
      <button onClick={() => onDigit("0")} disabled={disabled} style={btnStyle}>
        0
      </button>
      <button onClick={onBackspace} disabled={disabled} style={btnStyle}>
        ⌫
      </button>
    </div>
  );
}
