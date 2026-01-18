"use client";

import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    const t = localStorage.getItem("fg_client_admin_access_token");
    if (!t) window.location.href = "/client-admin/login";
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Client Admin</h1>
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <a href="/client-admin/outlets">Outlets</a>
        <a href="/client-admin/employees">Employees</a>
      </div>
    </div>
  );
}
