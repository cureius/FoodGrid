"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createTenant,
  deleteTenant,
  listTenants,
  updateTenant,
  activateTenant,
  deactivateTenant,
  type TenantUpsertInput
} from "@/lib/api/admin";
import { Building2, Plus, Edit, Trash2, Search, Power, PowerOff, Mail } from "lucide-react";
import { isTenantAdmin } from "@/lib/utils/admin";

export default function TenantsPage() {
  useEffect(() => {
    const t = localStorage.getItem("fg_admin_access_token");
    if (!t) {
      window.location.href = "/admin-login";
      return;
    }
    
    // Only tenant admin can access this page
    if (!isTenantAdmin()) {
      window.location.href = "/admin/employees";
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTenant, setCreatedTenant] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [tenants, setTenants] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any | null>(null);

  const [form, setForm] = useState<TenantUpsertInput>({ 
    name: "", 
    contactEmail: "",
    status: "ACTIVE"
  });

  const canSubmit = useMemo(() => {
    return !!form.name.trim();
  }, [form.name]);

  const filteredTenants = useMemo(() => {
    if (!searchQuery.trim()) return tenants;
    const query = searchQuery.toLowerCase();
    return tenants.filter(
      (t) =>
        t.name?.toLowerCase().includes(query) ||
        t.id?.toLowerCase().includes(query) ||
        t.contactEmail?.toLowerCase().includes(query)
    );
  }, [tenants, searchQuery]);

  async function refresh() {
    try {
      setLoading(true);
      const res = await listTenants();
      setTenants(res);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load tenants");
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
      const newTenant = await createTenant(form);
      setCreatedTenant(newTenant);
      setForm({ name: "", contactEmail: "", status: "ACTIVE" });
      setShowForm(false);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create tenant");
    } finally {
      setSaving(false);
    }
  }

  async function onUpdate() {
    if (!editingTenant || !canSubmit) return;
    try {
      setSaving(true);
      await updateTenant(editingTenant.id, form);
      setEditingTenant(null);
      setForm({ name: "", contactEmail: "", status: "ACTIVE" });
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update tenant");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(tenant: any) {
    setEditingTenant(tenant);
    setForm({
      name: tenant.name || "",
      contactEmail: tenant.contactEmail || "",
      status: tenant.status || "ACTIVE"
    });
    setShowForm(false);
  }

  function cancelEdit() {
    setEditingTenant(null);
    setForm({ name: "", contactEmail: "", status: "ACTIVE" });
  }

  async function onDelete(id: string) {
    if (!confirm(`Are you sure you want to delete this tenant? This will mark it as inactive.`)) {
      return;
    }
    try {
      setSaving(true);
      await deleteTenant(id);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete tenant");
    } finally {
      setSaving(false);
    }
  }

  async function onActivate(id: string) {
    try {
      setSaving(true);
      await activateTenant(id);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to activate tenant");
    } finally {
      setSaving(false);
    }
  }

  async function onDeactivate(id: string) {
    if (!confirm(`Are you sure you want to deactivate this tenant?`)) {
      return;
    }
    try {
      setSaving(true);
      await deactivateTenant(id);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to deactivate tenant");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ 
      padding: '32px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      background: 'var(--bg-app)',
      minHeight: '100vh'
    }}>
      {createdTenant && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          maxWidth: '400px',
          border: '1px solid var(--border-light)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontWeight: 700, fontSize: '16px' }}>Tenant Created Successfully!</h4>
            <button
              onClick={() => setCreatedTenant(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '20px'
              }}
            >
              &times;
            </button>
          </div>
          <p style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-muted)' }}>
            The admin user for <strong>{createdTenant.name}</strong> has been created with the following credentials.
            Please save this password securely, it will not be shown again.
          </p>
          <div style={{
            background: 'var(--bg-app)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'monospace',
            wordWrap: 'break-word'
          }}>
            <div><strong>Email:</strong> {createdTenant.adminEmail}</div>
            <div><strong>Password:</strong> {createdTenant.adminPassword}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 800, 
            marginBottom: '8px',
            color: 'var(--text-primary)'
          }}>
            Tenant Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
            Onboard and manage all tenants/clients in your system
          </p>
        </div>
        {!editingTenant && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              cancelEdit();
              setCreatedTenant(null);
            }}
            style={{
              background: 'var(--primary)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(75, 112, 245, 0.2)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(75, 112, 245, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(75, 112, 245, 0.2)';
            }}
          >
            <Plus size={20} />
            {showForm ? 'Cancel' : 'Add New Tenant'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ 
          color: 'var(--status-red)', 
          background: 'rgba(239, 68, 68, 0.1)',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '24px',
          fontSize: '14px',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {(showForm || editingTenant) && (
        <div style={{ 
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '32px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
        }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: 700, 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Building2 size={24} color="var(--primary)" />
            {editingTenant ? 'Edit Tenant' : 'Onboard New Tenant'}
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                Tenant Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Corporation"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.outline = 'none';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                }}
              />
            </div>
            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                Contact Email
              </label>
              <input
                type="email"
                placeholder="contact@example.com"
                value={form.contactEmail}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.outline = 'none';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                }}
              />
            </div>
            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.outline = 'none';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                }}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={editingTenant ? onUpdate : onCreate}
              disabled={!canSubmit || saving}
              style={{
                background: canSubmit ? 'var(--primary)' : 'var(--border-light)',
                color: canSubmit ? 'white' : 'var(--text-muted)',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '14px',
                border: 'none',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease'
              }}
            >
              {saving ? (editingTenant ? "Updating..." : "Creating...") : (editingTenant ? "Update Tenant" : "Create Tenant")}
            </button>
            {editingTenant && (
              <button
                onClick={cancelEdit}
                disabled={saving}
                style={{
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ 
        position: 'relative',
        marginBottom: '24px'
      }}>
        <Search 
          size={20} 
          style={{ 
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} 
        />
        <input
          type="text"
          placeholder="Search tenants by name, ID, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px 12px 48px',
            borderRadius: '12px',
            border: '1px solid var(--border-light)',
            fontSize: '14px',
            fontFamily: 'inherit',
            background: 'var(--bg-card)',
            transition: 'all 0.2s ease'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.outline = 'none';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(75, 112, 245, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-light)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Tenants List */}
      <div style={{ 
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-light)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
      }}>
        {loading ? (
          <div style={{ 
            padding: '60px', 
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            Loading tenants...
          </div>
        ) : filteredTenants.length === 0 ? (
          <div style={{ 
            padding: '60px', 
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            {searchQuery ? 'No tenants found matching your search.' : 'No tenants yet. Create your first tenant to get started.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ 
                  background: 'var(--bg-app)',
                  borderBottom: '2px solid var(--border-light)'
                }}>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px 20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Tenant Name
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px 20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Contact Email
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px 20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Status
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px 20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Tenant ID
                  </th>
                  <th style={{ 
                    textAlign: 'right', 
                    padding: '16px 20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant, idx) => (
                  <tr 
                    key={tenant.id}
                    style={{ 
                      borderBottom: idx < filteredTenants.length - 1 ? '1px solid var(--border-light)' : 'none',
                      transition: 'background 0.2s ease',
                      opacity: tenant.status === 'INACTIVE' ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-app)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ 
                      padding: '20px',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}>
                      {tenant.name}
                    </td>
                    <td style={{ 
                      padding: '20px',
                      fontSize: '14px',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {tenant.contactEmail ? (
                        <>
                          <Mail size={14} />
                          {tenant.contactEmail}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No email</span>
                      )}
                    </td>
                    <td style={{ 
                      padding: '20px',
                      fontSize: '14px'
                    }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: tenant.status === 'ACTIVE' 
                          ? 'rgba(34, 197, 94, 0.1)' 
                          : 'rgba(239, 68, 68, 0.1)',
                        color: tenant.status === 'ACTIVE' 
                          ? 'rgb(34, 197, 94)' 
                          : 'rgb(239, 68, 68)'
                      }}>
                        {tenant.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '20px',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      fontFamily: 'monospace',
                      fontWeight: 500
                    }}>
                      {tenant.id}
                    </td>
                    <td style={{ 
                      padding: '20px',
                      textAlign: 'right'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px',
                        justifyContent: 'flex-end',
                        flexWrap: 'wrap'
                      }}>
                        <button
                          onClick={() => startEdit(tenant)}
                          disabled={saving || editingTenant?.id === tenant.id}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-light)',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            fontWeight: 500,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.color = 'var(--primary)';
                            e.currentTarget.style.background = 'rgba(75, 112, 245, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-light)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        {tenant.status === 'ACTIVE' ? (
                          <button
                            onClick={() => onDeactivate(tenant.id)}
                            disabled={saving}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-light)',
                              background: 'transparent',
                              color: 'var(--status-orange)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '13px',
                              fontWeight: 500,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--status-orange)';
                              e.currentTarget.style.background = 'rgba(251, 146, 60, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-light)';
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <PowerOff size={14} />
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => onActivate(tenant.id)}
                            disabled={saving}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-light)',
                              background: 'transparent',
                              color: 'rgb(34, 197, 94)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '13px',
                              fontWeight: 500,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'rgb(34, 197, 94)';
                              e.currentTarget.style.background = 'rgba(34, 197, 94, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-light)';
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <Power size={14} />
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(tenant.id)}
                          disabled={saving}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-light)',
                            background: 'transparent',
                            color: 'var(--status-red)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            fontWeight: 500,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--status-red)';
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-light)';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filteredTenants.length > 0 && (
        <div style={{ 
          marginTop: '16px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '14px'
        }}>
          Showing {filteredTenants.length} of {tenants.length} tenant{tenants.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
