"use client";

export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* 
        Intuitive Grid Logo: 
        A 2x2 grid representing "FoodGrid" logic, 
        with one cell highlighted like a plate/location.
      */}
      <div 
        style={{ 
          width: size, 
          height: size, 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gridTemplateRows: "1fr 1fr", 
          gap: size * 0.1,
          padding: size * 0.1,
          background: "var(--primary)",
          borderRadius: size * 0.25,
          boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.3)"
        }}
      >
        <div style={{ background: "white", borderRadius: size * 0.08, opacity: 0.9 }}></div>
        <div style={{ background: "white", borderRadius: size * 0.08, opacity: 0.5 }}></div>
        <div style={{ background: "white", borderRadius: size * 0.08, opacity: 0.5 }}></div>
        <div style={{ background: "white", borderRadius: size * 0.08, opacity: 0.9 }}></div>
      </div>
      <span style={{ 
        fontSize: size * 0.65, 
        fontWeight: 800, 
        letterSpacing: "-0.03em", 
        color: "var(--text-main)",
        lineHeight: 1
      }}>
        FoodGrid
      </span>
    </div>
  );
}
