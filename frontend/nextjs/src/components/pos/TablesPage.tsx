"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  listTables,
  createTable,
  updateTable,
  deleteTable,
  type TableUpsertInput,
} from "@/lib/api/clientAdmin";
import { useOutlet } from "@/contexts/OutletContext";
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Edit,
  Trash2,
  Building2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  LayoutGrid,
} from "lucide-react";
import Card from "@/components/ui/Card";
import rStyles from "./Tables.module.css";

interface DiningTable {
  id: string;
  outletId: string;
  tableCode: string;
  displayName: string;
  capacity: number;
  status: string;
}


export default function TablesPage({ loginPath = "/client-admin/login" }: { loginPath?: string }) {
  const router = useRouter();
  const { selectedOutletId, selectedOutlet } = useOutlet();

  // State
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [filteredTables, setFilteredTables] = useState<DiningTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ title: string; description: string; type: "success" | "error" } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);

  // Form
  const [form, setForm] = useState<TableUpsertInput>({
    tableCode: "",
    displayName: "",
    capacity: 4,
    status: "ACTIVE",
  });

  const showToast = (title: string, description: string, type: "success" | "error") => {
    setToast({ title, description, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Auth check
  useEffect(() => {
    const isClientAdmin = loginPath.includes('client-admin');
    const tokenKey = isClientAdmin ? "fg_client_admin_access_token" : "fg_staff_access_token";
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      router.push(loginPath);
    }
  }, [router, loginPath]);

  // Close dialogs on ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setCreateDialogOpen(false);
        setEditDialogOpen(false);
        setDeleteDialogOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Fetch tables when outlet changes
  useEffect(() => {
    if (selectedOutletId) {
      fetchTables();
    } else {
      setTables([]);
      setFilteredTables([]);
      setLoading(false);
    }
  }, [selectedOutletId]);

  // Filter tables
  useEffect(() => {
    filterTables();
  }, [tables, searchQuery, statusFilter]);

  const fetchTables = async () => {
    if (!selectedOutletId) return;
    try {
      setLoading(true);
      const data = await listTables(selectedOutletId);
      setTables(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch tables";
      showToast("Error", message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTables();
    setRefreshing(false);
    showToast("Refreshed", "Table data has been updated", "success");
  };

  const filterTables = () => {
    let filtered = [...tables];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.tableCode.toLowerCase().includes(query) ||
          t.displayName.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (t) => t.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredTables(filtered);
  };

  const resetForm = () => {
    setForm({
      tableCode: "",
      displayName: "",
      capacity: 4,
      status: "ACTIVE",
    });
  };

  const handleCreateClick = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleEditClick = (table: DiningTable) => {
    setSelectedTable(table);
    setForm({
      tableCode: table.tableCode,
      displayName: table.displayName,
      capacity: table.capacity,
      status: table.status,
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (table: DiningTable) => {
    setSelectedTable(table);
    setDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!selectedOutletId || !form.tableCode.trim() || !form.displayName.trim()) return;

    try {
      setSaving(true);
      await createTable(selectedOutletId, form);
      showToast("Success", "Table created successfully", "success");
      setCreateDialogOpen(false);
      resetForm();
      fetchTables();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create table";
      showToast("Error", message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedOutletId || !selectedTable || !form.tableCode.trim() || !form.displayName.trim())
      return;

    try {
      setSaving(true);
      await updateTable(selectedOutletId, selectedTable.id, form);
      showToast("Success", "Table updated successfully", "success");
      setEditDialogOpen(false);
      setSelectedTable(null);
      resetForm();
      fetchTables();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update table";
      showToast("Error", message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOutletId || !selectedTable) return;

    try {
      setSaving(true);
      await deleteTable(selectedOutletId, selectedTable.id);
      showToast("Success", "Table deleted successfully", "success");
      setDeleteDialogOpen(false);
      setSelectedTable(null);
      fetchTables();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete table";
      showToast("Error", message, "error");
    } finally {
      setSaving(false);
    }
  };

  const activeCount = tables.filter((t) => t.status === "ACTIVE").length;
  const inactiveCount = tables.filter((t) => t.status === "INACTIVE").length;

  const stats = [
    { title: "Total Tables", value: tables.length, icon: LayoutGrid, color: "#6366f1", bgColor: "rgba(99, 102, 241, 0.1)" },
    { title: "Active", value: activeCount, icon: CheckCircle2, color: "var(--success)", bgColor: "rgba(16, 185, 129, 0.1)" },
    { title: "Inactive", value: inactiveCount, icon: XCircle, color: "var(--danger)", bgColor: "rgba(239, 68, 68, 0.1)" },
  ];

  const canSubmit = form.tableCode.trim() && form.displayName.trim();

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return { bg: "rgba(16, 185, 129, 0.1)", color: "var(--success)" };
      case "INACTIVE":
        return { bg: "rgba(239, 68, 68, 0.1)", color: "var(--danger)" };
      default:
        return { bg: "rgba(100, 116, 139, 0.1)", color: "var(--text-secondary)" };
    }
  };

  return (
    <div className={`page-container ${rStyles.pageContainer}`}>
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 1000,
            padding: "14px 18px",
            borderRadius: 14,
            background: toast.type === "success" ? "var(--success)" : "var(--danger)",
            color: "white",
            boxShadow: "0 14px 50px rgba(0,0,0,0.24)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            animation: "slideIn 0.25s ease",
            maxWidth: 420,
          }}
        >
          {toast.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{toast.title}</div>
            <div style={{ fontSize: 13, opacity: 0.92, marginTop: 2 }}>{toast.description}</div>
          </div>
        </div>
      )}

      <div className={rStyles.pageInner}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
            <div className={rStyles.headerRow}
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 20,
              marginBottom: 24,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  margin: 0,
                  background: "var(--text-primary)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.5px",
                }}
              >
                Tables
              </h1>
              <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: 15 }}>
                Manage dining tables and seating arrangements.
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button
                onClick={handleRefresh}
                disabled={refreshing || !selectedOutletId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "var(--bg-surface)",
                  cursor: refreshing || !selectedOutletId ? "not-allowed" : "pointer",
                  opacity: refreshing || !selectedOutletId ? 0.6 : 1,
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
                onMouseEnter={(e) => {
                  if (!refreshing && selectedOutletId) {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
                }}
                title="Refresh"
                aria-label="Refresh table list"
              >
                <RefreshCw size={18} style={{ color: "var(--text-secondary)", animation: refreshing ? "spin 1s linear infinite" : "none" }} />
              </button>

              <button
                onClick={handleCreateClick}
                disabled={!selectedOutletId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 20px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)",
                  color: "white",
                  cursor: !selectedOutletId ? "not-allowed" : "pointer",
                  opacity: !selectedOutletId ? 0.6 : 1,
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: "0 4px 14px rgba(139, 92, 246, 0.35)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (selectedOutletId) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.45)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(139, 92, 246, 0.35)";
                }}
              >
                <Plus size={18} />
                Add Table
              </button>
            </div>
          </div>

          {/* Stats */}
          {selectedOutletId && (
            <div className={rStyles.statsGrid}
            >
              {stats.map((stat, index) => (
                <div
                  key={index}
                  style={{
                    background: "var(--bg-surface)",
                    borderRadius: 20,
                    padding: 24,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.2s ease",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08), 0 12px 24px rgba(0,0,0,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.04)";
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>{stat.title}</p>
                    <p style={{ margin: "8px 0 0", fontSize: 36, fontWeight: 800, color: "var(--text-primary)", fontFeatureSettings: "'tnum' on, 'lnum' on" }}>{stat.value}</p>
                  </div>
                  <div style={{ padding: 16, borderRadius: 16, background: stat.bgColor }}>
                    <stat.icon size={28} style={{ color: stat.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        {selectedOutletId && (
          <div
            style={{
              background: "var(--bg-surface)",
              borderRadius: 20,
              padding: 20,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.04)",
              marginBottom: 24,
            }}
          >
            <div className={rStyles.filterBar}>
              <div style={{ display: "flex", gap: 12, flex: 1, flexWrap: "wrap" }}>
                <div className={rStyles.searchInputWrap}>
                  <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
                  <input
                    type="text"
                    placeholder="Search by code or name..."
                    value={searchQuery}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "14px 16px 14px 44px",
                      borderRadius: 12,
                      border: "1px solid var(--component-border)",
                      background: "var(--component-bg)",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--component-border)";
                      e.currentTarget.style.background = "var(--bg-secondary)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
                <div style={{ position: "relative", minWidth: 180 }}>
                  <Filter size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
                  <select
                    value={statusFilter}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "14px 16px 14px 38px",
                      borderRadius: 12,
                      border: "1px solid var(--component-border)",
                      background: "var(--component-bg)",
                      fontSize: 14,
                      cursor: "pointer",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--component-border)";
                      e.currentTarget.style.background = "var(--bg-secondary)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <option value="all">All status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {filteredTables.length} {filteredTables.length === 1 ? "table" : "tables"}
                </span>
                <div style={{ display: "flex", background: "var(--bg-tertiary)", borderRadius: 12, padding: 4, gap: 4 }}>
                  <button
                    onClick={() => setViewMode("grid")}
                    aria-label="Grid view"
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "none",
                      background: viewMode === "grid" ? "white" : "transparent",
                      boxShadow: viewMode === "grid" ? "0 2px 4px rgba(0,0,0,0.08)" : "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode !== "grid") {
                        e.currentTarget.style.background = "rgba(255,255,255,0.5)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (viewMode !== "grid") {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <Grid3X3 size={18} style={{ color: viewMode === "grid" ? "var(--primary)" : "var(--text-secondary)" }} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    aria-label="List view"
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "none",
                      background: viewMode === "list" ? "white" : "transparent",
                      boxShadow: viewMode === "list" ? "0 2px 4px rgba(0,0,0,0.08)" : "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode !== "list") {
                        e.currentTarget.style.background = "rgba(255,255,255,0.5)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (viewMode !== "list") {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <List size={18} style={{ color: viewMode === "list" ? "var(--primary)" : "var(--text-secondary)" }} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {!selectedOutletId ? (
          <Card>
            <div style={{ padding: 60, textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Building2 size={40} style={{ color: "var(--text-tertiary)" }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>Select an Outlet</h3>
              <p style={{ color: "var(--text-secondary)", maxWidth: 400, margin: "0 auto" }}>
                Please select an outlet from the dropdown above to manage its tables
              </p>
            </div>
          </Card>
        ) : loading ? (
          <div style={{ display: "grid", gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(280px, 1fr))" : "1fr", gap: 20 }}>
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <div style={{ padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--component-border)", animation: "pulse 2s infinite" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 20, background: "var(--component-border)", borderRadius: 6, marginBottom: 8, width: "60%", animation: "pulse 2s infinite" }} />
                      <div style={{ height: 16, background: "var(--component-border)", borderRadius: 6, width: "40%", animation: "pulse 2s infinite" }} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredTables.length === 0 ? (
          <Card>
            <div style={{ padding: 60, textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <LayoutGrid size={40} style={{ color: "var(--text-tertiary)" }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>No tables found</h3>
              <p style={{ color: "var(--text-secondary)", maxWidth: 400, margin: "0 auto 24px" }}>
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by adding your first table"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <button
                  onClick={handleCreateClick}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 24px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={18} />
                  Add First Table
                </button>
              )}
            </div>
          </Card>
        ) : viewMode === "grid" ? (
          <div className={rStyles.gridView}>
            {filteredTables.map((table) => {
              const statusColors = getStatusColor(table.status);
              return (
                <div
                  key={table.id}
                  style={{
                    background: "var(--bg-surface)",
                    borderRadius: 20,
                    padding: 24,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.04)",
                    transition: "all 0.3s ease",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.04)";
                  }}
                >
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      background: "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 20,
                      boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                    }}>
                      {table.tableCode.slice(0, 3).toUpperCase()}
                    </div>
                    <div style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      background: statusColors.bg,
                      color: statusColors.color,
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {table.status}
                    </div>
                  </div>

                  {/* Info */}
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px", color: "var(--text-primary)" }}>
                    {table.displayName}
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 16px" }}>
                    Code: <strong style={{ color: "var(--text-primary)" }}>{table.tableCode}</strong>
                  </p>

                  {/* Capacity */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 16px",
                    background: "var(--component-bg)",
                    borderRadius: 12,
                    marginBottom: 20,
                  }}>
                    <Users size={18} style={{ color: "var(--text-secondary)" }} />
                    <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                      Capacity: <strong style={{ color: "var(--text-primary)", fontSize: 15 }}>{table.capacity} guests</strong>
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => handleEditClick(table)}
                      style={{
                        flex: 1,
                        padding: "12px 18px",
                        borderRadius: 12,
                        border: "1px solid var(--component-border)",
                        background: "var(--bg-surface)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--primary)";
                        e.currentTarget.style.color = "var(--primary)";
                        e.currentTarget.style.background = "#faf5ff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--component-border)";
                        e.currentTarget.style.color = "var(--text-secondary)";
                        e.currentTarget.style.background = "white";
                      }}
                    >
                      <Edit size={16} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(table)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "var(--danger)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#fee2e2";
                        e.currentTarget.style.borderColor = "#fca5a5";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fef2f2";
                        e.currentTarget.style.borderColor = "#fecaca";
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredTables.map((table) => {
              const statusColors = getStatusColor(table.status);
              return (
                <div
                  key={table.id}
                  style={{
                    background: "var(--bg-surface)",
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.04)",
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12), 0 12px 24px rgba(0,0,0,0.08)";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.04)";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 18,
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.2)",
                  }}>
                    {table.tableCode.slice(0, 3).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>{table.displayName}</h3>
                      <div style={{
                        padding: "4px 12px",
                        borderRadius: 20,
                        background: statusColors.bg,
                        color: statusColors.color,
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {table.status}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, color: "var(--text-secondary)", fontSize: 14 }}>
                      <span>Code: <strong style={{ color: "var(--text-primary)" }}>{table.tableCode}</strong></span>
                      <span>•</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Users size={16} /> <strong style={{ color: "var(--text-primary)" }}>{table.capacity}</strong> guests
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      onClick={() => handleEditClick(table)}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 10,
                        border: "1px solid var(--component-border)",
                        background: "var(--bg-surface)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--primary)";
                        e.currentTarget.style.color = "var(--primary)";
                        e.currentTarget.style.background = "#faf5ff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--component-border)";
                        e.currentTarget.style.color = "var(--text-secondary)";
                        e.currentTarget.style.background = "white";
                      }}
                    >
                      <Edit size={16} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(table)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "var(--danger)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#fee2e2";
                        e.currentTarget.style.borderColor = "#fca5a5";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fef2f2";
                        e.currentTarget.style.borderColor = "#fecaca";
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Table Modal */}
        {createDialogOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
              padding: 20,
              animation: "fadeIn 0.2s ease",
            }}
            onClick={() => setCreateDialogOpen(false)}
          >
                <div className={rStyles.dialogContent}
                  onClick={(e) => e.stopPropagation()}
                >
              <div style={{ padding: 28, textAlign: "center", borderBottom: "1px solid var(--bg-tertiary)", background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(139, 92, 246, 0.3)" }}>
                  <LayoutGrid size={32} style={{ color: "white" }} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", color: "var(--text-primary)" }}>Add New Table</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 15, margin: 0 }}>Create a new table for {selectedOutlet?.name || 'the selected outlet'}</p>
              </div>
              <div style={{ padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Table Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. T01, A1, PATIO-1"
                    value={form.tableCode}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, tableCode: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--component-border)",
                      background: "var(--component-bg)",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--component-border)";
                      e.currentTarget.style.background = "var(--bg-secondary)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Display Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Table 1, Window Seat A"
                    value={form.displayName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, displayName: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--component-border)",
                      background: "var(--component-bg)",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--component-border)";
                      e.currentTarget.style.background = "var(--bg-secondary)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Capacity (guests)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    placeholder="4"
                    value={form.capacity ?? ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, capacity: parseInt(e.target.value) || undefined })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--component-border)",
                      background: "var(--component-bg)",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--component-border)";
                      e.currentTarget.style.background = "var(--bg-secondary)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, status: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--component-border)",
                      background: "var(--component-bg)",
                      fontSize: 14,
                      cursor: "pointer",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--component-border)";
                      e.currentTarget.style.background = "var(--bg-secondary)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ padding: "20px 28px 28px", display: "flex", gap: 12, borderTop: "1px solid var(--bg-tertiary)" }}>
                <button
                  onClick={() => setCreateDialogOpen(false)}
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    borderRadius: 12,
                    border: "1px solid var(--component-border)",
                    background: "var(--bg-surface)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--component-border-hover)";
                    e.currentTarget.style.background = "var(--bg-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--component-border)";
                    e.currentTarget.style.background = "white";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!canSubmit || saving}
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: !canSubmit || saving ? "not-allowed" : "pointer",
                    opacity: !canSubmit || saving ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: "0 4px 14px rgba(139, 92, 246, 0.35)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (canSubmit && !saving) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.45)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(139, 92, 246, 0.35)";
                  }}
                >
                  {saving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Creating...</> : <><Plus size={16} /> Create Table</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Table Modal */}
        {editDialogOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
              padding: 20,
              animation: "fadeIn 0.2s ease",
            }}
            onClick={() => { setEditDialogOpen(false); setSelectedTable(null); resetForm(); }}
          >
                <div className={rStyles.dialogContent}
                  onClick={(e) => e.stopPropagation()}
                >
              <div style={{ padding: 28, textAlign: "center", borderBottom: "1px solid var(--bg-tertiary)", background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, var(--info) 0%, #2563eb 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(59, 130, 246, 0.3)" }}>
                  <Edit size={32} style={{ color: "white" }} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", color: "var(--text-primary)" }}>Edit Table</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 15, margin: 0 }}>Update table information</p>
              </div>
              <div style={{ padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Table Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. T01, A1, PATIO-1"
                    value={form.tableCode}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, tableCode: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--component-border)",
                      background: "var(--component-bg)",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--info)";
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--component-border)";
                      e.currentTarget.style.background = "var(--bg-secondary)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Display Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Table 1, Window Seat A"
                    value={form.displayName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, displayName: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--component-border)",
                      background: "var(--component-bg)",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--info)";
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--component-border)";
                      e.currentTarget.style.background = "var(--bg-secondary)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Capacity (guests)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    placeholder="4"
                    value={form.capacity ?? ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, capacity: parseInt(e.target.value) || undefined })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--component-border)",
                      background: "var(--component-bg)",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--info)";
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--component-border)";
                      e.currentTarget.style.background = "var(--bg-secondary)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, status: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--component-border)",
                      background: "var(--component-bg)",
                      fontSize: 14,
                      cursor: "pointer",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--info)";
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--component-border)";
                      e.currentTarget.style.background = "var(--bg-secondary)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ padding: "20px 28px 28px", display: "flex", gap: 12, borderTop: "1px solid var(--bg-tertiary)" }}>
                <button
                  onClick={() => { setEditDialogOpen(false); setSelectedTable(null); resetForm(); }}
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    borderRadius: 12,
                    border: "1px solid var(--component-border)",
                    background: "var(--bg-surface)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--component-border-hover)";
                    e.currentTarget.style.background = "var(--bg-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--component-border)";
                    e.currentTarget.style.background = "white";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={!canSubmit || saving}
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, var(--info) 0%, #2563eb 100%)",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: !canSubmit || saving ? "not-allowed" : "pointer",
                    opacity: !canSubmit || saving ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.35)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (canSubmit && !saving) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.45)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(59, 130, 246, 0.35)";
                  }}
                >
                  {saving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Saving...</> : <><CheckCircle2 size={16} /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteDialogOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
              padding: 20,
              animation: "fadeIn 0.2s ease",
            }}
            onClick={() => { setDeleteDialogOpen(false); setSelectedTable(null); }}
          >
            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: 24,
                maxWidth: 440,
                width: "100%",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                animation: "slideUp 0.3s ease",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: 32, textAlign: "center", borderBottom: "1px solid var(--bg-tertiary)", background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, var(--danger) 0%, var(--danger) 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(239, 68, 68, 0.3)" }}>
                  <Trash2 size={32} style={{ color: "white" }} />
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>Delete Table?</h3>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 15 }}>
                  Are you sure you want to delete <strong style={{ color: "var(--text-primary)" }}>{selectedTable?.displayName}</strong>? This action cannot be undone.
                </p>
              </div>
              <div style={{ padding: "24px 28px 28px", display: "flex", gap: 12 }}>
                <button
                  onClick={() => { setDeleteDialogOpen(false); setSelectedTable(null); }}
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    borderRadius: 12,
                    border: "1px solid var(--component-border)",
                    background: "var(--bg-surface)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--component-border-hover)";
                    e.currentTarget.style.background = "var(--bg-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--component-border)";
                    e.currentTarget.style.background = "white";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, var(--danger) 0%, var(--danger) 100%)",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(239, 68, 68, 0.45)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(239, 68, 68, 0.35)";
                  }}
                >
                  {saving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Deleting...</> : <><Trash2 size={16} /> Delete Table</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        input:focus-visible, select:focus-visible, button:focus-visible {
          outline: 3px solid rgba(139,92,246,0.35) !important;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
