"use client";

import { useState } from "react";

export default function Page() {
  const [employeeCode, setEmployeeCode] = useState("");

  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <h1>Staff Login</h1>
      <div style={{ color: "#666", marginBottom: 12 }}>
        Staff login flow is separate from tenant-admin and client-admin.
      </div>
      <input
        placeholder="Employee code / email"
        value={employeeCode}
        onChange={(e) => setEmployeeCode(e.target.value)}
        style={{ width: "100%", padding: 12 }}
      />
      <button style={{ marginTop: 12, padding: "10px 14px" }} disabled>
        Continue
      </button>
    </div>
  );
}
