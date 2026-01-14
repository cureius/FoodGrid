"use client";

export default function PinBoxes(props: { length: number; valueLength: number }) {
  const { length, valueLength } = props;
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 42,
            height: 46,
            border: "1px solid #ccc",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20
          }}
        >
          {i < valueLength ? "•" : ""}
        </div>
      ))}
    </div>
  );
}
