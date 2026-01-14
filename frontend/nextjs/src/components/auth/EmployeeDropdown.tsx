"use client";

import { useMemo } from "react";

type ShiftTimeRange = { startTime: string; endTime: string } | null;

export type EmployeeListItem = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  scheduledShift?: ShiftTimeRange;
};

export default function EmployeeDropdown(props: {
  employees: EmployeeListItem[];
  value: string;
  onChange: (id: string) => void;
}) {
  const { employees, value, onChange } = props;

  const selected = useMemo(() => employees.find((e) => e.id === value), [employees, value]);

  if (!selected) return null;

  return (
    <div style={{ position: "relative", marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-card)",
          boxShadow: "var(--shadow-sm)",
          gap: 12,
        }}
      >
        <img
          src={selected.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selected.displayName)}&background=random`}
          alt={selected.displayName}
          style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", background: "var(--bg-gray)" }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>{selected.displayName}</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {selected.scheduledShift 
                ? `${fmt(selected.scheduledShift.startTime)} - ${fmt(selected.scheduledShift.endTime)}`
                : "No shift today"}
          </div>
        </div>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 7.5L10 12.5L15 7.5" stroke="#6B7280" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      {/* 
         Note: For a real dropdown we'd have a popover here. 
         For the sake of the "Login" screen matching the screenshot, 
         the selected state is shown. 
      */}
    </div>
  );
}

function fmt(hhmmss: string) {
  const [hStr, mStr] = hhmmss.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? "0");
  const am = h < 12;
  const h12 = ((h + 11) % 12) + 1;
  const mm = String(m).padStart(2, "0");
  return `${h12}:${mm} ${am ? "AM" : "PM"}`;
}
