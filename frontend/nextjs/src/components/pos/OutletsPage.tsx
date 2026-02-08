"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createOutlet,
  deleteOutlet,
  listOutlets,
  updateOutlet,
  type OutletUpsertInput,
} from "@/lib/api/clientAdmin";
import {
  Store,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  RefreshCw,
  Zap,
} from "lucide-react";
import Link from "next/link";

// Helper to decode JWT and get the subject (user ID)
function getUserIdFromToken(tokenKey: string): string | null {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(tokenKey)
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

// Toast component
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      padding: "14px 20px",
      borderRadius: 12,
      background: type === "success" ? "var(--success)" : "var(--danger)",
      color: "white",
      display: "flex",
      alignItems: "center",
      gap: 10,
      boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
      zIndex: 1000,
      animation: "slideIn 0.3s ease",
    }}>
      {type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
      <span style={{ fontWeight: 500 }}>{message}</span>
      <button onClick={onClose} style={{
        background: "rgba(255,255,255,0.2)",
        border: "none",
        borderRadius: 6,
        padding: 4,
        cursor: "pointer",
        display: "flex",
        marginLeft: 8,
      }}>
        <X size={14} color="white" />
      </button>
    </div>
  );
}

export default function OutletsPage({ loginPath = "/client-admin/login" }: { loginPath?: string }) {
  const isClientAdmin = loginPath.includes('client-admin');
  const tokenKey = isClientAdmin ? "fg_client_admin_access_token" : "fg_staff_access_token";

  useEffect(() => {
    const t = localStorage.getItem(tokenKey);
    if (!t) window.location.href = loginPath;
  }, [loginPath, tokenKey]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [outlets, setOutlets] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const emptyForm: OutletUpsertInput = {
    name: "",
    timezone: "Asia/Kolkata",
    ownerId: getUserIdFromToken(tokenKey) ?? "",
    status: "ACTIVE",
  };

  const [form, setForm] = useState<OutletUpsertInput>(emptyForm);

  const canSubmit = useMemo(
    () => !!form.name.trim() && !!form.timezone.trim() && !!form.ownerId,
    [form]
  );

  const filteredOutlets = useMemo(() => {
    if (!searchQuery.trim()) return outlets;
    const q = searchQuery.toLowerCase();
    return outlets.filter(
      (o) =>
        o.name?.toLowerCase().includes(q) ||
        o.timezone?.toLowerCase().includes(q) ||
        o.id?.toLowerCase().includes(q)
    );
  }, [outlets, searchQuery]);

  async function refresh() {
    try {
      setLoading(true);
      const res = await listOutlets();
      setOutlets(res ?? []);
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
        ownerId: outlet.ownerId || getUserIdFromToken(tokenKey) || "",
        status: outlet.status,
      });
    } else {
      const ownerId = getUserIdFromToken(tokenKey);
      if (!ownerId) {
        setToast({ message: "You must be logged in to create an outlet.", type: "error" });
        return;
      }
      setEditingOutlet(null);
      setForm({ ...emptyForm, ownerId });
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
        setToast({ message: "Outlet updated successfully!", type: "success" });
      } else {
        await createOutlet(form);
        setToast({ message: "Outlet created successfully!", type: "success" });
      }
      closeModal();
      await refresh();
    } catch (e: any) {
      setToast({ message: e?.message ?? "Failed to save outlet", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    try {
      setSaving(true);
      await deleteOutlet(id);
      setToast({ message: "Outlet deleted successfully!", type: "success" });
      setDeleteConfirm(null);
      await refresh();
    } catch (e: any) {
      setToast({ message: e?.message ?? "Failed to delete outlet", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const timezones = [
    "Asia/Kolkata",
    "Asia/Dubai",
    "Asia/Singapore",
    "Asia/Tokyo",
    "America/New_York",
    "America/Los_Angeles",
    "America/Chicago",
    "Europe/London",
    "Europe/Paris",
    "Australia/Sydney",
  ];

  return (
    <div style={{ padding: 32, background: "var(--bg-app)", minHeight: "100%", color: "var(--text-primary)" }}>
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 32,
      }}>
        <div>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            margin: 0,
            background: "var(--text-primary)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Outlets
          </h1>
          <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: 15 }}>
            Manage your restaurant locations and branches
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={refresh}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 12,
              border: "1px solid var(--component-border)",
              background: "var(--component-bg)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={18} style={{ color: "var(--text-secondary)", animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>

          <button
            onClick={() => openModal()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 20px",
              borderRadius: 12,
              border: "none",
              background: "var(--primary)",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 14px var(--primary-light)",
            }}
          >
            <Plus size={18} />
            Add Outlet
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 16,
        marginBottom: 24,
      }}>
        <div style={{
          flex: 1,
          minWidth: 280,
          position: "relative",
        }}>
            <Search size={18} style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-tertiary)",
          }} />
          <input
            type="text"
            placeholder="Search outlets by name, timezone, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px 12px 44px",
              borderRadius: 12,
              border: "1px solid var(--component-border)",
              background: "var(--component-bg)",
              color: "var(--text-primary)",
              fontSize: 14,
              outline: "none",
              transition: "border-color 0.2s",
            }}
          />
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "10px 16px",
          background: "var(--bg-surface)",
          borderRadius: 12,
          border: "1px solid var(--border-light)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)" }} />
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {outlets.filter((o) => o.status === "ACTIVE").length} Active
            </span>
          </div>
          <div style={{ width: 1, height: 16, background: "var(--border-light)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--danger)" }} />
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {outlets.filter((o) => o.status === "INACTIVE").length} Inactive
            </span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "14px 18px",
          borderRadius: 12,
          background: "var(--danger-light)",
          border: "1px solid var(--danger)",
          color: "var(--danger)",
          marginBottom: 24,
        }}>
          {error}
        </div>
      )}

      {/* Outlets Grid */}
      {loading ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 20,
        }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              background: "var(--bg-surface)",
              borderRadius: 16,
              padding: 24,
              border: "1px solid var(--border-light)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: "linear-gradient(90deg, var(--bg-tertiary) 25%, var(--component-border) 50%, var(--bg-tertiary) 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{
                    width: "60%",
                    height: 18,
                    background: "linear-gradient(90deg, var(--bg-tertiary) 25%, var(--component-border) 50%, var(--bg-tertiary) 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                    borderRadius: 4,
                    marginBottom: 8,
                  }} />
                  <div style={{
                    width: "40%",
                    height: 14,
                    background: "linear-gradient(90deg, var(--bg-tertiary) 25%, var(--component-border) 50%, var(--bg-tertiary) 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                    borderRadius: 4,
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredOutlets.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "var(--bg-surface)",
          borderRadius: 20,
          border: "1px solid var(--border-light)",
        }}>
          <Store size={56} style={{ color: "var(--text-tertiary)", marginBottom: 16 }} />
          <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
            {searchQuery ? "No outlets found" : "No outlets yet"}
          </h3>
          <p style={{ margin: "0 0 20px", color: "var(--text-secondary)", fontSize: 14 }}>
            {searchQuery
              ? "Try a different search term"
              : "Create your first outlet to get started"}
          </p>
          {!searchQuery && (
            <button
              onClick={() => openModal()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                borderRadius: 12,
                border: "none",
                background: "var(--primary)",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={18} />
              Create Outlet
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 20,
        }}>
          {filteredOutlets.map((outlet) => (
            <div key={outlet.id} style={{
              background: "var(--bg-surface)",
              borderRadius: 16,
              border: "1px solid var(--border-light)",
              overflow: "hidden",
              transition: "all 0.2s ease",
              boxShadow: "var(--shadow-sm)",
            }}>
              {/* Card Header */}
              <div style={{
                padding: "20px 20px 16px",
                borderBottom: "1px solid var(--border-light)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 16,
                    flexShrink: 0,
                  }}>
                    {(outlet.name ?? "O").slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {outlet.name ?? "Unnamed Outlet"}
                      </h3>
                      <div style={{
                        padding: "3px 8px",
                        borderRadius: 20,
                        background: outlet.status === "ACTIVE" ? "var(--success-light)" : "var(--danger-light)",
                        color: outlet.status === "ACTIVE" ? "var(--success)" : "var(--danger)",
                        fontSize: 11,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}>
                        {outlet.status ?? "ACTIVE"}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}>
                      <Clock size={12} />
                      {outlet.timezone ?? "No timezone"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: "16px 20px" }}>
                <div style={{
                  fontSize: 12,
                  color: "var(--text-tertiary)",
                  marginBottom: 4,
                }}>
                  Outlet ID
                </div>
                <div style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  background: "var(--bg-app)",
                  padding: "8px 12px",
                  borderRadius: 8,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {outlet.id}
                </div>
              </div>

              {/* Card Footer */}
              <div style={{
                padding: "12px 20px 16px",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}>
                <button
                  onClick={() => openModal(outlet)}
                  disabled={saving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--component-border)",
                    background: "var(--component-bg)",
                    color: "var(--text-secondary)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: saving ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Edit3 size={14} />
                  Edit
                </button>
                <Link
                  href={`${loginPath.replace('/login', '')}/outlets/${outlet.id}/integrations`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid rgba(139, 92, 246, 0.2)",
                    background: "rgba(139, 92, 246, 0.05)",
                    color: "#8b5cf6",
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Zap size={14} />
                  Integrations
                </Link>
                <button
                  onClick={() => setDeleteConfirm(outlet.id)}
                  disabled={saving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--danger-light)",
                    background: "var(--danger-light)",
                    color: "var(--danger)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: saving ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          zIndex: 100,
        }}>
          <div style={{
            background: "var(--bg-surface)",
            borderRadius: 20,
            width: "100%",
            maxWidth: 480,
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "var(--shadow-xl)",
            color: "var(--text-primary)",
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "var(--primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Building2 size={20} style={{ color: "var(--primary)" }} />
                </div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                  {editingOutlet ? "Edit Outlet" : "Create Outlet"}
                </h2>
              </div>
              <button
                onClick={closeModal}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: "none",
                  background: "var(--bg-tertiary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 8,
                }}>
                  Outlet Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Downtown Branch"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--component-border)",
                    background: "var(--component-bg)",
                    color: "var(--text-primary)",
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 8,
                }}>
                  Timezone *
                </label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--component-border)",
                    fontSize: 14,
                    outline: "none",
                    background: "var(--component-bg)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 8,
                }}>
                  Status
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: "ACTIVE" }))}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: 10,
                      border: form.status === "ACTIVE" ? "2px solid var(--success)" : "1px solid var(--component-border)",
                      background: form.status === "ACTIVE" ? "var(--success-light)" : "var(--component-bg)",
                      color: form.status === "ACTIVE" ? "var(--success)" : "var(--text-secondary)",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: "INACTIVE" }))}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: 10,
                      border: form.status === "INACTIVE" ? "2px solid var(--danger)" : "1px solid var(--component-border)",
                      background: form.status === "INACTIVE" ? "var(--danger-light)" : "var(--component-bg)",
                      color: form.status === "INACTIVE" ? "var(--danger)" : "var(--text-secondary)",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <XCircle size={16} />
                    Inactive
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "16px 24px 24px",
              display: "flex",
              gap: 12,
            }}>
              <button
                onClick={closeModal}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: "1px solid var(--component-border)",
                  background: "var(--component-bg)",
                  color: "var(--text-secondary)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || saving}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: !canSubmit || saving
                    ? "var(--border-light)"
                    : "var(--primary)",
                  color: !canSubmit || saving ? "var(--text-secondary)" : "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: !canSubmit || saving ? "not-allowed" : "pointer",
                  boxShadow: !canSubmit || saving ? "none" : "0 4px 14px var(--primary-light)",
                }}
              >
                {saving ? "Saving..." : editingOutlet ? "Update Outlet" : "Create Outlet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          zIndex: 100,
        }}>
          <div style={{
            background: "var(--bg-surface)",
            borderRadius: 20,
            width: "100%",
            maxWidth: 400,
            padding: 24,
            textAlign: "center",
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--danger-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <Trash2 size={28} style={{ color: "var(--danger)" }} />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
              Delete Outlet?
            </h3>
            <p style={{ margin: "0 0 24px", color: "var(--text-secondary)", fontSize: 14 }}>
              This action cannot be undone. All data associated with this outlet will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: "1px solid var(--border-light)",
                  background: "var(--bg-surface)",
                  color: "var(--text-secondary)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConfirm && onDelete(deleteConfirm)}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: "var(--danger)",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}