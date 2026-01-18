"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createOutlet,
  deleteOutlet,
  listOutlets,
  updateOutlet,
  type OutletUpsertInput,
} from "@/lib/api/clientAdmin";
import styles from "./Outlets.module.css";
import Link from "next/link";

// Helper to decode JWT and get the subject (user ID)
function getUserIdFromToken(): string | null {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("fg_client_admin_access_token")
      : null;
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decodedPayload = atob(payload);
    const parsedPayload = JSON.parse(decodedPayload);
    return parsedPayload.sub;
  } catch (e) {
    console.error("Failed to decode token", e);
    return null;
  }
}

export default function Page() {
  useEffect(() => {
    const t = localStorage.getItem("fg_client_admin_access_token");
    if (!t) window.location.href = "/client-admin/login";
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [outlets, setOutlets] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<any | null>(null);

  const emptyForm: OutletUpsertInput = {
    name: "",
    timezone: "Asia/Kolkata",
    ownerId: getUserIdFromToken() ?? "",
    status: "ACTIVE",
  };

  const [form, setForm] = useState<OutletUpsertInput>(emptyForm);

  const canSubmit = useMemo(
    () => !!form.name.trim() && !!form.timezone.trim() && !!form.ownerId,
    [form]
  );

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

  function openModal(outlet: any | null = null) {
    if (outlet) {
      setEditingOutlet(outlet);
      setForm({
        name: outlet.name,
        timezone: outlet.timezone,
        ownerId: outlet.ownerId,
        status: outlet.status,
      });
    } else {
      const ownerId = getUserIdFromToken();
      if (!ownerId) {
        setError("You must be logged in to create an outlet.");
        return;
      }
      setEditingOutlet(null);
      setForm({...emptyForm, ownerId});
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingOutlet(null);
    setForm(emptyForm);
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    try {
      setSaving(true);
      if (editingOutlet) {
        await updateOutlet(editingOutlet.id, form);
      } else {
        await createOutlet(form);
      }
      closeModal();
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save outlet");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Are you sure you want to delete this outlet?")) return;
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

  return (
    <div className={styles.container}>
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            <Link href="/client-admin">Dashboard</Link>
            <Link href="/client-admin/outlets" style={{fontWeight: 'bold'}}>Outlets</Link>
            <Link href="/client-admin/employees">Employees</Link>
        </div>
      <div className={styles.header}>
        <h1 className={styles.title}>Outlets</h1>
        <button
          className={`${styles.button} ${styles.primaryButton}`}
          onClick={() => openModal()}
        >
          Add Outlet
        </button>
      </div>

      {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className={styles.grid}>
          {outlets.map((o) => (
            <div key={o.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{o.name}</h2>
                <span
                  style={{
                    backgroundColor:
                      o.status === "ACTIVE" ? "#dcfce7" : "#fee2e2",
                    color: o.status === "ACTIVE" ? "#166534" : "#991b1b",
                    padding: "4px 8px",
                    borderRadius: "9999px",
                    fontSize: "0.875rem",
                  }}
                >
                  {o.status}
                </span>
              </div>
              <div className={styles.cardContent}>
                <p>Timezone: {o.timezone}</p>
                <p style={{ wordBreak: 'break-all'}}>ID: {o.id}</p>
              </div>
              <div className={styles.cardFooter}>
                <button
                  className={`${styles.button} ${styles.secondaryButton}`}
                  onClick={() => openModal(o)}
                  disabled={saving}
                >
                  Edit
                </button>
                <button
                  className={`${styles.button} ${styles.dangerButton}`}
                  onClick={() => onDelete(o.id)}
                  disabled={saving}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingOutlet ? "Edit Outlet" : "Create Outlet"}
              </h2>
              <button onClick={closeModal}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Outlet Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Downtown Branch"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="timezone">Timezone</label>
                <input
                  id="timezone"
                  type="text"
                  placeholder="e.g. Asia/Kolkata"
                  value={form.timezone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, timezone: e.target.value }))
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={`${styles.button} ${styles.secondaryButton}`}
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className={`${styles.button} ${styles.primaryButton}`}
                onClick={handleSubmit}
                disabled={!canSubmit || saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}