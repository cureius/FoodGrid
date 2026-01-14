"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createOutlet,
  deleteOutlet,
  listOutlets,
  updateOutlet,
  type OutletUpsertInput
} from "@/lib/api/admin";

export default function Page() {
  useEffect(() => {
    const t = localStorage.getItem("fg_admin_access_token");
    if (!t) window.location.href = "/admin-login";
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [outlets, setOutlets] = useState<any[]>([]);

  const [form, setForm] = useState<OutletUpsertInput>({ name: "", timezone: "Asia/Kolkata" });

  const canSubmit = useMemo(() => {
    return !!form.name.trim() && !!form.timezone.trim();
  }, [form.name, form.timezone]);

  async function refresh() {
    try {
      setLoading(true);
      const res = await listOutlets();
      setOutlets(res);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load outlets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate() {
    if (!canSubmit) return;
    try {
      setSaving(true);
      await createOutlet(form);
      setForm({ name: "", timezone: "Asia/Kolkata" });
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create outlet");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    try {
      setSaving(true);
      await deleteOutlet(id);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete outlet");
    } finally {
      setSaving(false);
    }
  }

  async function onQuickUpdate(o: any) {
    const name = prompt("Outlet name", o.name);
    if (name == null) return;

    const timezone = prompt("Timezone", o.timezone);
    if (timezone == null) return;

    try {
      setSaving(true);
      await updateOutlet(o.id, { name, timezone });
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update outlet");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Outlets</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <a href="/admin/employees">Employees</a>
        <a href="/admin/outlets">Outlets</a>
      </div>

      {error ? <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div> : null}

      <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, maxWidth: 720 }}>
        <h3>Create Outlet</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input
            placeholder="Outlet name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            placeholder="Timezone (e.g. Asia/Kolkata)"
            value={form.timezone}
            onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
          />
        </div>
        <button onClick={onCreate} disabled={!canSubmit || saving} style={{ marginTop: 12 }}>
          {saving ? "Saving…" : "Create"}
        </button>
        <div style={{ marginTop: 8, color: "#666", fontSize: 12 }}>
          Note: creating/deleting outlets requires a global ADMIN (token without outletId claim).
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Outlet List</h3>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Name</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Timezone</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>ID</th>
                <th style={{ borderBottom: "1px solid #ddd", padding: 8 }} />
              </tr>
            </thead>
            <tbody>
              {outlets.map((o) => (
                <tr key={o.id}>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{o.name}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{o.timezone}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8, fontFamily: "monospace" }}>{o.id}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8, textAlign: "right" }}>
                    <button onClick={() => onQuickUpdate(o)} disabled={saving}>
                      Edit
                    </button>
                    <button onClick={() => onDelete(o.id)} disabled={saving} style={{ marginLeft: 8 }}>
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
