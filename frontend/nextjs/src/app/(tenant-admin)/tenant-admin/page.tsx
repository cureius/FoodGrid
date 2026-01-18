"use client";

import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    const t = localStorage.getItem("fg_tenant_admin_access_token");
    if (!t) window.location.href = "/tenant-admin-login";
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Tenant Admin</h1>
      <div style={{ color: "#666", marginTop: 8 }}>
        Dashboard placeholder. Tenant admin flow is isolated from client-admin and staff.
      </div>
    </div>
  );
}
