"use client";

export default function PinBoxes(props: { length: number; valueLength: number }) {
  const { length, valueLength } = props;
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 54,
            height: 54,
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            background: "var(--bg-card)",
            boxShadow: "var(--shadow-sm)"
          }}
        >
          {i < valueLength ? "•" : ""}
        </div>
      ))}
    </div>
  );
}
