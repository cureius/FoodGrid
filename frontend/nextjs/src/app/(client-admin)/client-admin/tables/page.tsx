"use client";

import { useEffect, useState, useMemo, ChangeEvent } from "react";
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
  Store,
  Loader2,
  Users,
  Hash,
  LayoutGrid,
  X,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface DiningTable {
  id: string;
  outletId: string;
  tableCode: string;
  displayName: string;
  capacity: number;
  status: string;
}


export default function TablesPage() {
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
    const token = localStorage.getItem("fg_client_admin_access_token");
    if (!token) {
      router.push("/client-admin/login");
    }
  }, [router]);

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
    { title: "Active", value: activeCount, icon: CheckCircle2, color: "#10b981", bgColor: "rgba(16, 185, 129, 0.1)" },
    { title: "Inactive", value: inactiveCount, icon: XCircle, color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.1)" },
  ];

  const canSubmit = form.tableCode.trim() && form.displayName.trim();

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" };
      case "INACTIVE":
        return { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" };
      default:
        return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b" };
    }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
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
            background: toast.type === "success" ? "#10b981" : "#ef4444",
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

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 32 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 18,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  margin: 0,
                  background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.5px",
                }}
              >
                Tables
              </h1>
              <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 15 }}>
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
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  background: "white",
                  cursor: refreshing || !selectedOutletId ? "not-allowed" : "pointer",
                  opacity: refreshing || !selectedOutletId ? 0.6 : 1,
                }}
                title="Refresh"
                aria-label="Refresh table list"
              >
                <RefreshCw size={18} style={{ color: "#64748b", animation: refreshing ? "spin 1s linear infinite" : "none" }} />
              </button>

              <button
                onClick={handleCreateClick}
                disabled={!selectedOutletId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 18px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                  color: "white",
                  cursor: !selectedOutletId ? "not-allowed" : "pointer",
                  opacity: !selectedOutletId ? 0.6 : 1,
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: "0 6px 18px rgba(139, 92, 246, 0.28)",
                }}
              >
                <Plus size={18} />
                Add Table
              </button>
            </div>
          </div>

          {/* Stats */}
          {selectedOutletId && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
                marginBottom: 20,
              }}
            >
              {stats.map((stat, index) => (
                <Card key={index}>
                  <div style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, color: "#64748b", fontWeight: 600 }}>{stat.title}</p>
                      <p style={{ margin: "8px 0 0", fontSize: 34, fontWeight: 800, color: "#1e293b" }}>{stat.value}</p>
                    </div>
                    <div style={{ padding: 14, borderRadius: 14, background: stat.bgColor }}>
                      <stat.icon size={26} style={{ color: stat.color }} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        {selectedOutletId && (
          <Card style={{ marginBottom: 20 }}>
            <div style={{ padding: 16, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
              <div style={{ display: "flex", gap: 12, flex: 1, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 400 }}>
                  <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    placeholder="Search by code or name..."
                    value={searchQuery}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 42px",
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ position: "relative", minWidth: 180 }}>
                  <Filter size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <select
                    value={statusFilter}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 36px",
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      fontSize: 14,
                      cursor: "pointer",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="all">All status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{filteredTables.length} tables</span>
                <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 4 }}>
                  <button
                    onClick={() => setViewMode("grid")}
                    aria-label="Grid view"
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: viewMode === "grid" ? "white" : "transparent",
                      boxShadow: viewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                      cursor: "pointer",
                    }}
                  >
                    <Grid3X3 size={18} style={{ color: viewMode === "grid" ? "#7c3aed" : "#64748b" }} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    aria-label="List view"
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: viewMode === "list" ? "white" : "transparent",
                      boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                      cursor: "pointer",
                    }}
                  >
                    <List size={18} style={{ color: viewMode === "list" ? "#7c3aed" : "#64748b" }} />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Content */}
        {!selectedOutletId ? (
          <Card>
            <div style={{ padding: 60, textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Building2 size={40} style={{ color: "#94a3b8" }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>Select an Outlet</h3>
              <p style={{ color: "#64748b", maxWidth: 400, margin: "0 auto" }}>
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
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: "#e2e8f0", animation: "pulse 2s infinite" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 20, background: "#e2e8f0", borderRadius: 6, marginBottom: 8, width: "60%", animation: "pulse 2s infinite" }} />
                      <div style={{ height: 16, background: "#e2e8f0", borderRadius: 6, width: "40%", animation: "pulse 2s infinite" }} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredTables.length === 0 ? (
          <Card>
            <div style={{ padding: 60, textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <LayoutGrid size={40} style={{ color: "#94a3b8" }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>No tables found</h3>
              <p style={{ color: "#64748b", maxWidth: 400, margin: "0 auto 24px" }}>
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
                    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {filteredTables.map((table) => {
              const statusColors = getStatusColor(table.status);
              return (
                <Card key={table.id} style={{ overflow: "hidden" }}>
                  <div style={{ padding: 20 }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: 14,
                        background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 700,
                        fontSize: 18,
                      }}>
                        {table.tableCode.slice(0, 3).toUpperCase()}
                      </div>
                      <div style={{
                        padding: "6px 12px",
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
                    <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px", color: "#1e293b" }}>
                      {table.displayName}
                    </h3>
                    <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px" }}>
                      Code: {table.tableCode}
                    </p>

                    {/* Capacity */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      background: "#f8fafc",
                      borderRadius: 10,
                      marginBottom: 16,
                    }}>
                      <Users size={16} style={{ color: "#64748b" }} />
                      <span style={{ fontSize: 14, color: "#64748b" }}>
                        Capacity: <strong style={{ color: "#1e293b" }}>{table.capacity} guests</strong>
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleEditClick(table)}
                        style={{
                          flex: 1,
                          padding: "10px 16px",
                          borderRadius: 10,
                          border: "1px solid #e2e8f0",
                          background: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 500,
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
                          color: "#ef4444",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredTables.map((table) => {
              const statusColors = getStatusColor(table.status);
              return (
                <Card key={table.id}>
                  <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
                    {/* Icon */}
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 16,
                      flexShrink: 0,
                    }}>
                      {table.tableCode.slice(0, 3).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{table.displayName}</h3>
                        <div style={{
                          padding: "4px 10px",
                          borderRadius: 20,
                          background: statusColors.bg,
                          color: statusColors.color,
                          fontSize: 11,
                          fontWeight: 600,
                        }}>
                          {table.status}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#64748b", fontSize: 13, marginTop: 4 }}>
                        <span>Code: {table.tableCode}</span>
                        <span>•</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Users size={14} /> {table.capacity} guests
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={() => handleEditClick(table)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          background: "white",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(table)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1px solid #fecaca",
                          background: "#fef2f2",
                          color: "#ef4444",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Table Modal */}
        {createDialogOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
            <div style={{ background: "white", borderRadius: 20, maxWidth: 440, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(139, 92, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <LayoutGrid size={20} style={{ color: "#8b5cf6" }} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Add New Table</h2>
                </div>
                <button
                  onClick={() => setCreateDialogOpen(false)}
                  style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={18} style={{ color: "#64748b" }} />
                </button>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>Table Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. T01, A1, PATIO-1"
                    value={form.tableCode}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, tableCode: e.target.value })}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>Display Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Table 1, Window Seat A"
                    value={form.displayName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, displayName: e.target.value })}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>Capacity (guests)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    placeholder="4"
                    value={form.capacity ?? ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, capacity: parseInt(e.target.value) || undefined })}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, status: e.target.value })}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, cursor: "pointer", outline: "none", boxSizing: "border-box" }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ padding: "16px 24px 24px", display: "flex", gap: 12 }}>
                <button
                  onClick={() => setCreateDialogOpen(false)}
                  style={{ flex: 1, padding: "12px 20px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!canSubmit || saving}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: !canSubmit || saving ? "#e2e8f0" : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                    color: !canSubmit || saving ? "#94a3b8" : "white",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: !canSubmit || saving ? "not-allowed" : "pointer",
                    boxShadow: !canSubmit || saving ? "none" : "0 4px 14px rgba(139, 92, 246, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {saving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Creating...</> : <><Plus size={16} /> Create</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Table Modal */}
        {editDialogOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
            <div style={{ background: "white", borderRadius: 20, maxWidth: 440, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(59, 130, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Edit size={20} style={{ color: "#3b82f6" }} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Edit Table</h2>
                </div>
                <button
                  onClick={() => { setEditDialogOpen(false); setSelectedTable(null); resetForm(); }}
                  style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={18} style={{ color: "#64748b" }} />
                </button>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>Table Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. T01, A1, PATIO-1"
                    value={form.tableCode}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, tableCode: e.target.value })}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>Display Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Table 1, Window Seat A"
                    value={form.displayName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, displayName: e.target.value })}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>Capacity (guests)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    placeholder="4"
                    value={form.capacity ?? ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, capacity: parseInt(e.target.value) || undefined })}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, status: e.target.value })}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, cursor: "pointer", outline: "none", boxSizing: "border-box" }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ padding: "16px 24px 24px", display: "flex", gap: 12 }}>
                <button
                  onClick={() => { setEditDialogOpen(false); setSelectedTable(null); resetForm(); }}
                  style={{ flex: 1, padding: "12px 20px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={!canSubmit || saving}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: !canSubmit || saving ? "#e2e8f0" : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    color: !canSubmit || saving ? "#94a3b8" : "white",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: !canSubmit || saving ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
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
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
            <div style={{ background: "white", borderRadius: 20, maxWidth: 400, width: "100%", padding: 24, textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Trash2 size={28} style={{ color: "#ef4444" }} />
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: "#1e293b" }}>Delete Table?</h3>
              <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: 14 }}>
                Are you sure you want to delete <strong style={{ color: "#1e293b" }}>{selectedTable?.displayName}</strong>? This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => { setDeleteDialogOpen(false); setSelectedTable(null); }}
                  style={{ flex: 1, padding: "12px 20px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: "#ef4444",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {saving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Deleting...</> : <><Trash2 size={16} /> Delete</>}
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
        input:focus-visible, select:focus-visible, button:focus-visible {
          outline: 3px solid rgba(139,92,246,0.35) !important;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
