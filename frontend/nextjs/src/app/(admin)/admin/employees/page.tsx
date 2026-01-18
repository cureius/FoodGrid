"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
  type EmployeeUpsertInput
} from "@/lib/api/admin";

export default function Page() {
  const outletId = process.env.NEXT_PUBLIC_OUTLET_ID ?? "";

  useEffect(() => {
    const t = localStorage.getItem("fg_admin_access_token");
    if (!t) window.location.href = "/admin-login";
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [employees, setEmployees] = useState<any[]>([]);

  const [form, setForm] = useState<EmployeeUpsertInput>({
    displayName: "",
    email: "",
    avatarUrl: "",
    status: "ACTIVE",
    pin: ""
  });

  const canSubmit = useMemo(() => {
    return !!outletId && !!form.displayName.trim() && !!form.email.trim();
  }, [outletId, form.displayName, form.email]);

  async function refresh() {
    if (!outletId) {
      setError("NEXT_PUBLIC_OUTLET_ID is required");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await listEmployees(outletId);
      setEmployees(res);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  async function onCreate() {
    if (!canSubmit) return;
    try {
      setSaving(true);
      await createEmployee(outletId, form);
      setForm({ displayName: "", email: "", avatarUrl: "", status: "ACTIVE", pin: "" });
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    try {
      setSaving(true);
      await deleteEmployee(outletId, id);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete");
    } finally {
      setSaving(false);
    }
  }

  async function onQuickUpdate(e: any) {
    const displayName = prompt("Display name", e.displayName);
    if (displayName == null) return;

    const status = prompt("Status (ACTIVE/INACTIVE)", e.status);
    if (status == null) return;

    try {
      setSaving(true);
      await updateEmployee(outletId, e.id, {
        displayName,
        email: e.email,
        avatarUrl: e.avatarUrl ?? "",
        status,
        pin: ""
      });
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Employees</h1>


      {error ? <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div> : null}

      <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, maxWidth: 720 }}>
        <h3>Create Employee</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input
            placeholder="Display name"
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
          />
          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <input
            placeholder="Avatar URL"
            value={form.avatarUrl}
            onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
          />
          <input
            placeholder="Status (ACTIVE/INACTIVE)"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          />
          <input
            placeholder="PIN (6 digits, optional)"
            value={form.pin}
            onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))}
          />
        </div>
        <button onClick={onCreate} disabled={!canSubmit || saving} style={{ marginTop: 12 }}>
          {saving ? "Saving…" : "Create"}
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Employee List</h3>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Name</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Email</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Status</th>
                <th style={{ borderBottom: "1px solid #ddd", padding: 8 }} />
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{e.displayName}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{e.email}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{e.status}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8, textAlign: "right" }}>
                    <button onClick={() => onQuickUpdate(e)} disabled={saving}>
                      Edit
                    </button>
                    <button onClick={() => onDelete(e.id)} disabled={saving} style={{ marginLeft: 8 }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
