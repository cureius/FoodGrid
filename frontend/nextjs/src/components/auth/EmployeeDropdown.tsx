"use client";

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

  return (
    <div style={{ marginBottom: 12 }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: 10 }}
      >
        {employees.map((e) => {
          const shift = e.scheduledShift ? `${fmt(e.scheduledShift.startTime)} - ${fmt(e.scheduledShift.endTime)}` : "";
          return (
            <option key={e.id} value={e.id}>
              {e.displayName}{shift ? ` — ${shift}` : ""}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function fmt(hhmmss: string) {
  // Minimal client formatting; UI can be styled later to match screenshot.
  const [hStr, mStr] = hhmmss.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? "0");
  const am = h < 12;
  const h12 = ((h + 11) % 12) + 1;
  const mm = String(m).padStart(2, "0");
  return `${h12}:${mm} ${am ? "AM" : "PM"}`;
}
