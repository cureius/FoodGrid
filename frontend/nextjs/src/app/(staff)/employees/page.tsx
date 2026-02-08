"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
  type EmployeeUpsertInput,
} from "@/lib/api/clientAdmin";
import { useOutlet } from "@/contexts/OutletContext";
import {
  Plus,
  Users,
  Search,
  Filter,
  Grid3X3,
  List,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  ShieldCheck,
  ShieldX,
  Building2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
} from "lucide-react";
import Card from "@/components/ui/Card";

interface Employee {
  id: string;
  outletId: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  status: string;
}


export default function EmployeesPage() {
  const router = useRouter();
  const { selectedOutletId, selectedOutlet } = useOutlet();

  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // Form
  const [form, setForm] = useState<EmployeeUpsertInput>({
    displayName: "",
    email: "",
    avatarUrl: "",
    status: "ACTIVE",
    pin: "",
  });
  const [showPin, setShowPin] = useState(false);

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

  // Close dropdown on ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDropdownOpen(null);
        setCreateDialogOpen(false);
        setEditDialogOpen(false);
        setDeleteDialogOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Fetch employees when outlet changes
  useEffect(() => {
    if (selectedOutletId) {
      fetchEmployees();
    } else {
      setEmployees([]);
      setFilteredEmployees([]);
      setLoading(false);
    }
  }, [selectedOutletId]);

  // Filter employees
  useEffect(() => {
    filterEmployees();
  }, [employees, searchQuery, statusFilter]);

  const fetchEmployees = async () => {
    if (!selectedOutletId) return;
    try {
      setLoading(true);
      const data = await listEmployees(selectedOutletId);
      setEmployees(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch employees";
      showToast("Error", message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees();
    setRefreshing(false);
    showToast("Refreshed", "Employee data has been updated", "success");
  };

  const filterEmployees = () => {
    let filtered = [...employees];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.displayName.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (emp) => emp.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredEmployees(filtered);
  };

  const resetForm = () => {
    setForm({
      displayName: "",
      email: "",
      avatarUrl: "",
      status: "ACTIVE",
      pin: "",
    });
    setShowPin(false);
  };

  const handleCreateClick = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setForm({
      displayName: employee.displayName,
      email: employee.email,
      avatarUrl: employee.avatarUrl || "",
      status: employee.status,
      pin: "",
    });
    setEditDialogOpen(true);
    setDropdownOpen(null);
  };

  const handleDeleteClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
    setDropdownOpen(null);
  };

  const handleCreate = async () => {
    if (!selectedOutletId || !form.displayName.trim() || !form.email.trim()) return;

    try {
      setSaving(true);
      await createEmployee(selectedOutletId, form);
      showToast("Success", "Employee created successfully", "success");
      setCreateDialogOpen(false);
      resetForm();
      fetchEmployees();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create employee";
      showToast("Error", message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedOutletId || !selectedEmployee || !form.displayName.trim() || !form.email.trim())
      return;

    try {
      setSaving(true);
      await updateEmployee(selectedOutletId, selectedEmployee.id, form);
      showToast("Success", "Employee updated successfully", "success");
      setEditDialogOpen(false);
      setSelectedEmployee(null);
      resetForm();
      fetchEmployees();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update employee";
      showToast("Error", message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOutletId || !selectedEmployee) return;

    try {
      setSaving(true);
      await deleteEmployee(selectedOutletId, selectedEmployee.id);
      showToast("Success", "Employee deleted successfully", "success");
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete employee";
      showToast("Error", message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (employee: Employee) => {
    if (!selectedOutletId) return;
    const newStatus = employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      setSaving(true);
      await updateEmployee(selectedOutletId as string, employee.id, {
        displayName: employee.displayName,
        email: employee.email,
        avatarUrl: employee.avatarUrl || "",
        status: newStatus,
        pin: "",
      });
      showToast("Success", `Employee ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`, "success");
      fetchEmployees();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update status";
      showToast("Error", message, "error");
    } finally {
      setSaving(false);
      setDropdownOpen(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const activeCount = employees.filter((e) => e.status === "ACTIVE").length;
  const inactiveCount = employees.filter((e) => e.status !== "ACTIVE").length;

  const stats = [
    { title: "Total Employees", value: employees.length, icon: Users, color: "#6366f1", bgColor: "rgba(99, 102, 241, 0.1)" },
    { title: "Active", value: activeCount, icon: CheckCircle2, color: "var(--success)", bgColor: "rgba(16, 185, 129, 0.1)" },
    { title: "Inactive", value: inactiveCount, icon: XCircle, color: "var(--danger)", bgColor: "rgba(239, 68, 68, 0.1)" },
  ];

  const canSubmit = form.displayName.trim() && form.email.trim();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", color: "var(--text-primary)" }}>
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
            <div style={{ fontSize: 13, opacity: 0.92, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>
              {toast.description}
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "32px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div
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
                  color: "var(--text-primary)",
                  letterSpacing: "-0.5px",
                }}
              >
                Employees
              </h1>
              <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: 15 }}>
                Add, edit, and manage staff for each outlet.
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
                  gap: 8,
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  border: "1px solid var(--component-border)",
                  background: "var(--component-bg)",
                  cursor: refreshing || !selectedOutletId ? "not-allowed" : "pointer",
                  opacity: refreshing || !selectedOutletId ? 0.6 : 1,
                  transition: "all 0.2s ease",
                  boxShadow: "var(--shadow-sm)",
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
                aria-label="Refresh employee list"
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
                <UserPlus size={18} />
                Add Employee
              </button>
            </div>
          </div>

          {/* Stats */}
          {selectedOutletId && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 20,
                marginBottom: 24,
              }}
            >
              {stats.map((stat, index) => (
                <div
                  key={index}
                  style={{
                    background: "var(--bg-surface)",
                    borderRadius: 20,
                    padding: 24,
                    boxShadow: "var(--shadow-md)",
                    border: "1px solid var(--border-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.2s ease",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
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
              boxShadow: "var(--shadow-md)",
              border: "1px solid var(--border-light)",
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div style={{ display: "flex", gap: 12, flex: 1, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 240, maxWidth: 480 }}>
                  <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
                  <input
                    type="text"
                    placeholder="Search employees by name or email..."
                    value={searchQuery}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "14px 16px 14px 44px",
                      borderRadius: 12,
                      border: "1px solid var(--border-light)",
                      background: "var(--bg-tertiary)",
                      fontSize: 14,
                      outline: "none",
                      color: "var(--text-primary)",
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
                      border: "1px solid var(--border-light)",
                      background: "var(--bg-tertiary)",
                      fontSize: 14,
                      cursor: "pointer",
                      outline: "none",
                      color: "var(--text-primary)",
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
                  {filteredEmployees.length} {filteredEmployees.length === 1 ? "employee" : "employees"}
                </span>
                <div style={{ display: "flex", background: "var(--bg-tertiary)", borderRadius: 12, padding: 4, gap: 4 }}>
                  <button
                    onClick={() => setViewMode("grid")}
                    aria-label="Grid view"
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "none",
                      background: viewMode === "grid" ? "var(--bg-surface)" : "transparent",
                      boxShadow: viewMode === "grid" ? "var(--shadow-sm)" : "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode !== "grid") {
                        e.currentTarget.style.background = "var(--component-hover)";
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
                      background: viewMode === "list" ? "var(--bg-surface)" : "transparent",
                      boxShadow: viewMode === "list" ? "var(--shadow-sm)" : "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode !== "list") {
                        e.currentTarget.style.background = "var(--component-hover)";
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
                Please select an outlet from the dropdown above to manage its employees
              </p>
            </div>
          </Card>
        ) : loading ? (
          <div style={{ display: "grid", gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(300px, 1fr))" : "1fr", gap: 20 }}>
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <div style={{ padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--component-border)", animation: "pulse 2s infinite" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 20, background: "var(--component-border)", borderRadius: 6, marginBottom: 8, width: "70%", animation: "pulse 2s infinite" }} />
                      <div style={{ height: 16, background: "var(--component-border)", borderRadius: 6, width: "50%", animation: "pulse 2s infinite" }} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <Card>
            <div style={{ padding: 60, textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Users size={40} style={{ color: "var(--text-tertiary)" }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>No employees found</h3>
              <p style={{ color: "var(--text-secondary)", maxWidth: 400, margin: "0 auto 24px" }}>
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by adding your first employee"}
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
                    cursor: "pointer"
                  }}
                >
                  <UserPlus size={18} />
                  Add First Employee
                </button>
              )}
            </div>
          </Card>
        ) : viewMode === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                style={{
                  background: "var(--bg-surface)",
                  borderRadius: 20,
                  overflow: "hidden",
                  boxShadow: "var(--shadow-md)",
                  border: "1px solid var(--border-light)",
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
                {/* Gradient Header */}
                <div style={{ position: "relative", height: 100, background: "linear-gradient(135deg, var(--primary) 0%, #6366f1 50%, #4f46e5 100%)" }}>
                  <div style={{ position: "absolute", top: 14, right: 14 }}>
                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: 20,
                        background: employee.status === "ACTIVE" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                        backdropFilter: "blur(10px)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "white",
                      }}
                    >
                      {employee.status === "ACTIVE" ? <ShieldCheck size={12} /> : <ShieldX size={12} />}
                      {employee.status}
                    </div>
                  </div>
                  <div style={{ position: "absolute", top: 14, left: 14 }}>
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => setDropdownOpen(dropdownOpen === employee.id ? null : employee.id)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          border: "none",
                          background: "rgba(255,255,255,0.25)",
                          backdropFilter: "blur(10px)",
                          color: "white",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.35)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {dropdownOpen === employee.id && (
                        <div style={{
                          position: "absolute",
                          top: 44,
                          left: 0,
                          background: "var(--bg-surface)",
                          borderRadius: 14,
                          boxShadow: "var(--shadow-lg)",
                          minWidth: 200,
                          zIndex: 100,
                          overflow: "hidden",
                          animation: "slideDown 0.2s ease",
                        }}>
                          <button
                            onClick={() => handleEditClick(employee)}
                            style={{
                              width: "100%",
                              padding: "12px 18px",
                              border: "none",
                              background: "none",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              cursor: "pointer",
                              fontSize: 14,
                              fontWeight: 500,
                              color: "var(--text-primary)",
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--bg-tertiary)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <Edit size={16} style={{ color: "var(--text-secondary)" }} /> Edit Employee
                          </button>
                          <button
                            onClick={() => handleToggleStatus(employee)}
                            style={{
                              width: "100%",
                              padding: "12px 18px",
                              border: "none",
                              background: "none",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              cursor: "pointer",
                              fontSize: 14,
                              fontWeight: 500,
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--bg-secondary)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            {employee.status === "ACTIVE" ? <><XCircle size={16} style={{ color: "var(--text-secondary)" }} /> Deactivate</> : <><CheckCircle2 size={16} style={{ color: "var(--text-secondary)" }} /> Activate</>}
                          </button>
                          <div style={{ height: 1, background: "var(--component-border)", margin: "4px 0" }} />
                          <button
                            onClick={() => handleDeleteClick(employee)}
                            style={{
                              width: "100%",
                              padding: "12px 18px",
                              border: "none",
                              background: "none",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              cursor: "pointer",
                              fontSize: 14,
                              fontWeight: 500,
                              color: "var(--danger)",
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#fef2f2";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <Trash2 size={16} /> Delete Employee
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Avatar */}
                  <div style={{ position: "absolute", bottom: -48, left: "50%", transform: "translateX(-50%)" }}>
                    <div style={{
                      width: 96,
                      height: 96,
                      borderRadius: "50%",
                      background: employee.avatarUrl ? `url(${employee.avatarUrl}) center/cover` : "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)",
                      border: "5px solid white",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: 28,
                      fontWeight: 700,
                    }}>
                      {!employee.avatarUrl && getInitials(employee.displayName)}
                    </div>
                  </div>
                </div>

                <div style={{ padding: "64px 24px 24px", textAlign: "center" }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "var(--text-primary)" }}>{employee.displayName}</h3>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text-secondary)", fontSize: 14 }}>
                    <Mail size={16} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }}>{employee.email}</span>
                  </div>
                </div>

                <div style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
                  <button
                    onClick={() => handleEditClick(employee)}
                    style={{
                      flex: 1,
                      padding: "12px 18px",
                      borderRadius: 12,
                      border: "1px solid var(--border-light)",
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
                      e.currentTarget.style.background = "var(--primary-light)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-light)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                      e.currentTarget.style.background = "var(--bg-surface)";
                    }}
                  >
                    <Edit size={16} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(employee)}
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
            ))}
          </div>
        ) : (
          /* List View */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                style={{
                  background: "white",
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
                {/* Avatar */}
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: employee.avatarUrl ? `url(${employee.avatarUrl}) center/cover` : "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)",
                  border: "3px solid rgba(139, 92, 246, 0.2)",
                  boxShadow: "0 4px 12px rgba(139, 92, 246, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 20,
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {!employee.avatarUrl && getInitials(employee.displayName)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>{employee.displayName}</h3>
                    <div
                      style={{
                        padding: "4px 12px",
                        borderRadius: 20,
                        background: employee.status === "ACTIVE" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        color: employee.status === "ACTIVE" ? "var(--success)" : "var(--danger)",
                        fontSize: 12,
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {employee.status === "ACTIVE" ? <ShieldCheck size={12} /> : <ShieldX size={12} />}
                      {employee.status}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 14 }}>
                    <Mail size={16} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{employee.email}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={() => handleEditClick(employee)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "1px solid var(--border-light)",
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
                      e.currentTarget.style.background = "var(--primary-light)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-light)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                      e.currentTarget.style.background = "var(--bg-surface)";
                    }}
                  >
                    <Edit size={16} /> Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(employee)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "1px solid var(--component-border)",
                      background: "white",
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
                      e.currentTarget.style.borderColor = employee.status === "ACTIVE" ? "var(--warning)" : "var(--success)";
                      e.currentTarget.style.color = employee.status === "ACTIVE" ? "var(--warning)" : "var(--success)";
                      e.currentTarget.style.background = employee.status === "ACTIVE" ? "#fffbeb" : "#f0fdf4";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--component-border)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                      e.currentTarget.style.background = "white";
                    }}
                  >
                    {employee.status === "ACTIVE" ? <><XCircle size={16} /> Deactivate</> : <><CheckCircle2 size={16} /> Activate</>}
                  </button>
                  <button
                    onClick={() => handleDeleteClick(employee)}
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
            ))}
          </div>
        )}

        {/* Modal Backdrop - Close dropdowns on click */}
        {dropdownOpen && (
          <div
            onClick={() => setDropdownOpen(null)}
            style={{ position: "fixed", inset: 0, zIndex: 50, cursor: "default" }}
            aria-hidden="true"
          />
        )}

        {/* Create Employee Modal */}
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
            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: 24,
                maxWidth: 480,
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
                boxShadow: "var(--shadow-xl)",
                animation: "slideUp 0.3s ease",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: 28, textAlign: "center", borderBottom: "1px solid var(--border-light)", background: "var(--bg-tertiary)" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(139, 92, 246, 0.3)" }}>
                  <UserPlus size={32} style={{ color: "white" }} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", color: "var(--text-primary)" }}>Add New Employee</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 15, margin: 0 }}>Create a new employee for {selectedOutlet?.name || 'the selected outlet'}</p>
              </div>
              <div style={{ padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Display Name *</label>
                  <input
                    type="text"
                    placeholder="Enter employee name"
                    value={form.displayName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, displayName: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--border-light)",
                      background: "var(--bg-tertiary)",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                      color: "var(--text-primary)",
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
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Email Address *</label>
                  <input
                    type="email"
                    placeholder="employee@example.com"
                    value={form.email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--component-border)",
                      background: "var(--bg-secondary)",
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
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Avatar URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={form.avatarUrl}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, avatarUrl: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--component-border)",
                      background: "var(--bg-secondary)",
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
                      background: "var(--bg-secondary)",
                      fontSize: 14,
                      outline: "none",
                      cursor: "pointer",
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
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>PIN Code (6 digits)</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPin ? "text" : "password"}
                      placeholder="Enter 6-digit PIN"
                      value={form.pin}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, pin: e.target.value })}
                      maxLength={6}
                      style={{
                        width: "100%",
                        padding: "12px 44px 12px 16px",
                        borderRadius: 12,
                        border: "1px solid var(--component-border)",
                        background: "var(--bg-secondary)",
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
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 6,
                        borderRadius: 6,
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--bg-tertiary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {showPin ? <EyeOff size={18} style={{ color: "var(--text-tertiary)" }} /> : <Eye size={18} style={{ color: "var(--text-tertiary)" }} />}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ padding: "20px 28px 28px", display: "flex", gap: 12, borderTop: "1px solid var(--bg-tertiary)" }}>
                <button
                  onClick={() => setCreateDialogOpen(false)}
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    borderRadius: 12,
                    border: "1px solid var(--border-light)",
                    background: "var(--bg-surface)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-medium)";
                    e.currentTarget.style.background = "var(--bg-tertiary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-light)";
                    e.currentTarget.style.background = "var(--bg-surface)";
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
                  {saving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Creating...</> : <><Plus size={16} /> Create Employee</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Employee Modal */}
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
            onClick={() => { setEditDialogOpen(false); setSelectedEmployee(null); resetForm(); }}
          >
            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: 24,
                maxWidth: 480,
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
                boxShadow: "var(--shadow-xl)",
                animation: "slideUp 0.3s ease",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: 28, textAlign: "center", borderBottom: "1px solid var(--border-light)", background: "var(--bg-tertiary)" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(59, 130, 246, 0.3)" }}>
                  <Edit size={32} style={{ color: "white" }} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", color: "var(--text-primary)" }}>Edit Employee</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 15, margin: 0 }}>Update employee information</p>
              </div>
              <div style={{ padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Display Name *</label>
                  <input
                    type="text"
                    placeholder="Enter employee name"
                    value={form.displayName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, displayName: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--border-light)",
                      background: "var(--bg-tertiary)",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                      color: "var(--text-primary)",
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
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Email Address *</label>
                  <input
                    type="email"
                    placeholder="employee@example.com"
                    value={form.email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--component-border)",
                      background: "var(--bg-secondary)",
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
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Avatar URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={form.avatarUrl}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, avatarUrl: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--component-border)",
                      background: "var(--bg-secondary)",
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
                      background: "var(--bg-secondary)",
                      fontSize: 14,
                      outline: "none",
                      cursor: "pointer",
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
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>New PIN Code (optional)</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPin ? "text" : "password"}
                      placeholder="Leave blank to keep current"
                      value={form.pin}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, pin: e.target.value })}
                      maxLength={6}
                      style={{
                        width: "100%",
                        padding: "12px 44px 12px 16px",
                        borderRadius: 12,
                        border: "1px solid var(--component-border)",
                        background: "var(--bg-secondary)",
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
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 6,
                        borderRadius: 6,
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--bg-tertiary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {showPin ? <EyeOff size={18} style={{ color: "var(--text-tertiary)" }} /> : <Eye size={18} style={{ color: "var(--text-tertiary)" }} />}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ padding: "20px 28px 28px", display: "flex", gap: 12, borderTop: "1px solid var(--bg-tertiary)" }}>
                <button
                  onClick={() => { setEditDialogOpen(false); setSelectedEmployee(null); resetForm(); }}
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    borderRadius: 12,
                    border: "1px solid var(--component-border)",
                    background: "white",
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
            onClick={() => { setDeleteDialogOpen(false); setSelectedEmployee(null); }}
          >
            <div
              style={{
                background: "white",
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
                  <AlertCircle size={32} style={{ color: "white" }} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px", color: "var(--text-primary)" }}>Delete Employee</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 15, margin: 0 }}>
                  Are you sure you want to delete <strong style={{ color: "var(--text-primary)" }}>{selectedEmployee?.displayName}</strong>? This action cannot be undone.
                </p>
              </div>
              <div style={{ padding: "24px 28px 28px", display: "flex", gap: 12 }}>
                <button
                  onClick={() => { setDeleteDialogOpen(false); setSelectedEmployee(null); }}
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    borderRadius: 12,
                    border: "1px solid var(--component-border)",
                    background: "white",
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
                  {saving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Deleting...</> : <><Trash2 size={16} /> Delete Employee</>}
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
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* Better focus visibility */
        input:focus-visible, select:focus-visible, button:focus-visible {
          outline: 3px solid rgba(139,92,246,0.35) !important;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
