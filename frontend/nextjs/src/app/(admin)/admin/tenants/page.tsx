"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createOutlet,
  deleteOutlet,
  listOutlets,
  updateOutlet,
  type OutletUpsertInput
} from "@/lib/api/admin";
import { Building2, Plus, Edit, Trash2, Search } from "lucide-react";

export default function TenantsPage() {
  useEffect(() => {
    const t = localStorage.getItem("fg_admin_access_token");
    if (!t) {
      window.location.href = "/admin-login";
      return;
    }
    
    // Check if user is super admin (no outletId in token)
    try {
      const base64Url = t.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      if (decoded?.outletId) {
        // Not a super admin, redirect to employees
        window.location.href = "/admin/employees";
      }
    } catch {
      // If token decode fails, allow access (might be a different token format)
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [tenants, setTenants] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<OutletUpsertInput>({ 
    name: "", 
    timezone: "Asia/Kolkata" 
  });

  const canSubmit = useMemo(() => {
    return !!form.name.trim() && !!form.timezone.trim();
  }, [form.name, form.timezone]);

  const filteredTenants = useMemo(() => {
    if (!searchQuery.trim()) return tenants;
    const query = searchQuery.toLowerCase();
    return tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query) ||
        t.timezone.toLowerCase().includes(query)
    );
  }, [tenants, searchQuery]);

  async function refresh() {
    try {
      setLoading(true);
      const res = await listOutlets();
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
      await createOutlet(form);
      setForm({ name: "", timezone: "Asia/Kolkata" });
      setShowForm(false);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create tenant");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm(`Are you sure you want to delete this tenant? This action cannot be undone.`)) {
      return;
    }
    try {
      setSaving(true);
      await deleteOutlet(id);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete tenant");
    } finally {
      setSaving(false);
    }
  }

  async function onUpdate(tenant: any) {
    const name = prompt("Tenant/Outlet name", tenant.name);
    if (name == null || !name.trim()) return;

    const timezone = prompt("Timezone (e.g. Asia/Kolkata)", tenant.timezone);
    if (timezone == null || !timezone.trim()) return;

    try {
      setSaving(true);
      await updateOutlet(tenant.id, { name: name.trim(), timezone: timezone.trim() });
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update tenant");
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
        <button
          onClick={() => setShowForm(!showForm)}
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
      </div>

      {/* Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <a 
          href="/admin/employees" 
          style={{ 
            padding: '8px 16px',
            borderRadius: '8px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--primary)';
            e.currentTarget.style.background = 'rgba(75, 112, 245, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Employees
        </a>
        <a 
          href="/admin/outlets" 
          style={{ 
            padding: '8px 16px',
            borderRadius: '8px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--primary)';
            e.currentTarget.style.background = 'rgba(75, 112, 245, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Outlets
        </a>
        <a 
          href="/admin/tenants" 
          style={{ 
            padding: '8px 16px',
            borderRadius: '8px',
            color: 'var(--primary)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
            background: 'rgba(75, 112, 245, 0.1)'
          }}
        >
          Tenants
        </a>
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

      {/* Create Form */}
      {showForm && (
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
            Onboard New Tenant
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
                Tenant/Outlet Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Downtown Restaurant"
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
                Timezone *
              </label>
              <input
                type="text"
                placeholder="e.g. Asia/Kolkata"
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
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
          </div>
          <button
            onClick={onCreate}
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
            {saving ? "Creating..." : "Create Tenant"}
          </button>
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
          placeholder="Search tenants by name, ID, or timezone..."
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
                    Timezone
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
                      transition: 'background 0.2s ease'
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
                      fontFamily: 'monospace'
                    }}>
                      {tenant.timezone}
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
                        justifyContent: 'flex-end'
                      }}>
                        <button
                          onClick={() => onUpdate(tenant)}
                          disabled={saving}
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
