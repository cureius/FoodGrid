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
  Store,
  Loader2,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

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
    const newStatus = employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      setSaving(true);
      await updateEmployee(selectedOutletId, employee.id, {
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
    { title: "Active", value: activeCount, icon: CheckCircle2, color: "#10b981", bgColor: "rgba(16, 185, 129, 0.1)" },
    { title: "Inactive", value: inactiveCount, icon: XCircle, color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.1)" },
  ];

  const canSubmit = form.displayName.trim() && form.email.trim();

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
            <div style={{ fontSize: 13, opacity: 0.92, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>
              {toast.description}
            </div>
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
                Employees
              </h1>
              <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 15 }}>
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
                  gap: 8,
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  background: "white",
                  cursor: refreshing || !selectedOutletId ? "not-allowed" : "pointer",
                  opacity: refreshing || !selectedOutletId ? 0.6 : 1,
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                title="Refresh"
                aria-label="Refresh employee list"
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
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
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
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
                marginBottom: 20,
              }}
            >
              {stats.map((stat, index) => (
                <Card key={index} style={{ transition: "transform 0.2s, box-shadow 0.2s" }}>
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
                <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 460 }}>
                  <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    placeholder="Search employees by name or email..."
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
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{filteredEmployees.length} employees</span>
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
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#e2e8f0", animation: "pulse 2s infinite" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 20, background: "#e2e8f0", borderRadius: 6, marginBottom: 8, width: "70%", animation: "pulse 2s infinite" }} />
                      <div style={{ height: 16, background: "#e2e8f0", borderRadius: 6, width: "50%", animation: "pulse 2s infinite" }} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <Card>
            <div style={{ padding: 60, textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Users size={40} style={{ color: "#94a3b8" }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>No employees found</h3>
              <p style={{ color: "#64748b", maxWidth: 400, margin: "0 auto 24px" }}>
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
                    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} style={{ overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }}>
                {/* Gradient Header */}
                <div style={{ position: "relative", height: 80, background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #4f46e5 100%)" }}>
                  <div style={{ position: "absolute", top: 12, right: 12 }}>
                    <Badge variant={employee.status === "ACTIVE" ? "success" : "danger"}>
                      {employee.status === "ACTIVE" ? <ShieldCheck size={12} style={{ marginRight: 4 }} /> : <ShieldX size={12} style={{ marginRight: 4 }} />}
                      {employee.status}
                    </Badge>
                  </div>
                  <div style={{ position: "absolute", top: 12, left: 12 }}>
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => setDropdownOpen(dropdownOpen === employee.id ? null : employee.id)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: "none",
                          background: "rgba(255,255,255,0.2)",
                          color: "white",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {dropdownOpen === employee.id && (
                        <div style={{
                          position: "absolute",
                          top: 40,
                          left: 0,
                          background: "white",
                          borderRadius: 12,
                          boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                          minWidth: 180,
                          zIndex: 100,
                          overflow: "hidden"
                        }}>
                          <button onClick={() => handleEditClick(employee)} style={{ width: "100%", padding: "12px 16px", border: "none", background: "none", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
                            <Edit size={16} style={{ color: "#64748b" }} /> Edit Employee
                          </button>
                          <button onClick={() => handleToggleStatus(employee)} style={{ width: "100%", padding: "12px 16px", border: "none", background: "none", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
                            {employee.status === "ACTIVE" ? <><XCircle size={16} style={{ color: "#64748b" }} /> Deactivate</> : <><CheckCircle2 size={16} style={{ color: "#64748b" }} /> Activate</>}
                          </button>
                          <div style={{ height: 1, background: "#e2e8f0" }} />
                          <button onClick={() => handleDeleteClick(employee)} style={{ width: "100%", padding: "12px 16px", border: "none", background: "none", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "#ef4444" }}>
                            <Trash2 size={16} /> Delete Employee
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Avatar */}
                  <div style={{ position: "absolute", bottom: -40, left: "50%", transform: "translateX(-50%)" }}>
                    <div style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: employee.avatarUrl ? `url(${employee.avatarUrl}) center/cover` : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                      border: "4px solid white",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: 24,
                      fontWeight: 600
                    }}>
                      {!employee.avatarUrl && getInitials(employee.displayName)}
                    </div>
                  </div>
                </div>

                <div style={{ padding: "56px 20px 20px", textAlign: "center" }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>{employee.displayName}</h3>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#64748b", fontSize: 13 }}>
                    <Mail size={14} />
                    <span>{employee.email}</span>
                  </div>
                </div>

                <div style={{ padding: "0 20px 20px", display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleEditClick(employee)}
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
                      transition: "all 0.2s"
                    }}
                  >
                    <Edit size={16} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(employee)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #fecaca",
                      background: "#fef2f2",
                      color: "#ef4444",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} style={{ transition: "box-shadow 0.2s" }}>
                <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: employee.avatarUrl ? `url(${employee.avatarUrl}) center/cover` : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                    border: "2px solid rgba(139, 92, 246, 0.2)",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: 18,
                    fontWeight: 600,
                    flexShrink: 0
                  }}>
                    {!employee.avatarUrl && getInitials(employee.displayName)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{employee.displayName}</h3>
                      <Badge variant={employee.status === "ACTIVE" ? "success" : "danger"}>
                        {employee.status}
                      </Badge>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13, marginTop: 4 }}>
                      <Mail size={14} />
                      <span>{employee.email}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => handleEditClick(employee)}
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
                        fontWeight: 500
                      }}
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(employee)}
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
                        fontWeight: 500
                      }}
                    >
                      {employee.status === "ACTIVE" ? <><XCircle size={14} /> Deactivate</> : <><CheckCircle2 size={14} /> Activate</>}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(employee)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#ef4444",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
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
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
            <div style={{ background: "white", borderRadius: 20, maxWidth: 440, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
              <div style={{ padding: 24, textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(139, 92, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <UserPlus size={28} style={{ color: "#8b5cf6" }} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px" }}>Add New Employee</h2>
                <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Create a new employee for {selectedOutlet?.name || 'the selected outlet'}</p>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Display Name *</label>
                  <input
                    type="text"
                    placeholder="Enter employee name"
                    value={form.displayName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, displayName: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Email Address *</label>
                  <input
                    type="email"
                    placeholder="employee@example.com"
                    value={form.email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Avatar URL</label>
                  <input
                    type="text"
                    placeholder="https://example.com/avatar.jpg"
                    value={form.avatarUrl}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, avatarUrl: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, status: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, outline: "none", cursor: "pointer", boxSizing: "border-box" }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>PIN Code (6 digits)</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPin ? "text" : "password"}
                      placeholder="Enter 6-digit PIN"
                      value={form.pin}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, pin: e.target.value })}
                      maxLength={6}
                      style={{ width: "100%", padding: "10px 44px 10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
                    >
                      {showPin ? <EyeOff size={18} style={{ color: "#94a3b8" }} /> : <Eye size={18} style={{ color: "#94a3b8" }} />}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ padding: "16px 24px 24px", display: "flex", gap: 12 }}>
                <button
                  onClick={() => setCreateDialogOpen(false)}
                  style={{ flex: 1, padding: "12px 20px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
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
                    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: !canSubmit || saving ? "not-allowed" : "pointer",
                    opacity: !canSubmit || saving ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8
                  }}
                >
                  {saving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Creating...</> : <><Plus size={16} /> Create</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Employee Modal */}
        {editDialogOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
            <div style={{ background: "white", borderRadius: 20, maxWidth: 440, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
              <div style={{ padding: 24, textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(59, 130, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Edit size={28} style={{ color: "#3b82f6" }} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px" }}>Edit Employee</h2>
                <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Update employee information</p>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Display Name *</label>
                  <input
                    type="text"
                    placeholder="Enter employee name"
                    value={form.displayName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, displayName: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Email Address *</label>
                  <input
                    type="email"
                    placeholder="employee@example.com"
                    value={form.email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Avatar URL</label>
                  <input
                    type="text"
                    placeholder="https://example.com/avatar.jpg"
                    value={form.avatarUrl}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, avatarUrl: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, status: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, outline: "none", cursor: "pointer", boxSizing: "border-box" }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>New PIN Code (optional)</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPin ? "text" : "password"}
                      placeholder="Leave blank to keep current"
                      value={form.pin}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, pin: e.target.value })}
                      maxLength={6}
                      style={{ width: "100%", padding: "10px 44px 10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
                    >
                      {showPin ? <EyeOff size={18} style={{ color: "#94a3b8" }} /> : <Eye size={18} style={{ color: "#94a3b8" }} />}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ padding: "16px 24px 24px", display: "flex", gap: 12 }}>
                <button
                  onClick={() => { setEditDialogOpen(false); setSelectedEmployee(null); resetForm(); }}
                  style={{ flex: 1, padding: "12px 20px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
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
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: !canSubmit || saving ? "not-allowed" : "pointer",
                    opacity: !canSubmit || saving ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8
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
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
            <div style={{ background: "white", borderRadius: 20, maxWidth: 400, width: "100%" }}>
              <div style={{ padding: 24, textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <AlertCircle size={28} style={{ color: "#ef4444" }} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>Delete Employee</h2>
                <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
                  Are you sure you want to delete <strong style={{ color: "#1e293b" }}>{selectedEmployee?.displayName}</strong>? This action cannot be undone.
                </p>
              </div>
              <div style={{ padding: "16px 24px 24px", display: "flex", gap: 12 }}>
                <button
                  onClick={() => { setDeleteDialogOpen(false); setSelectedEmployee(null); }}
                  style={{ flex: 1, padding: "12px 20px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
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
                    gap: 8
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

        /* Better focus visibility */
        input:focus-visible, select:focus-visible, button:focus-visible {
          outline: 3px solid rgba(139,92,246,0.35) !important;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
