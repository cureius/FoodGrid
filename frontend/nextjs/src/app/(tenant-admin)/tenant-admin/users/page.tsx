"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  listAdminUsers, 
  createAdminUser, 
  updateAdminUser, 
  deleteAdminUser, 
  updateAdminUserRoles,
  listTenants,
  type AdminUserResponse,
  type AdminUserCreateInput,
  type TenantResponse
} from "@/lib/api/admin";
import { Users, Plus, Edit, Trash2, Search, Shield, ShieldCheck, Mail, Building2, UserCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { isTenantAdmin } from "@/lib/utils/admin";

export default function UsersPage() {
  useEffect(() => {
    const t = localStorage.getItem("fg_tenant_admin_access_token");
    if (!t) {
      if (typeof globalThis !== 'undefined' && globalThis.location) {
        globalThis.location.href = "/tenant-admin-login";
      }
      return;
    }
    
    if (!isTenantAdmin()) {
      if (typeof globalThis !== 'undefined' && globalThis.location) {
        globalThis.location.href = "/admin-login";
      }
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<string>("all");

  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserResponse | null>(null);

  const [form, setForm] = useState<AdminUserCreateInput>({
    email: "",
    password: "",
    displayName: "",
    status: "ACTIVE",
    clientId: ""
  });

  async function refresh() {
    try {
      setLoading(true);
      const [usersRes, tenantsRes] = await Promise.all([
        listAdminUsers(selectedTenant === "all" ? undefined : selectedTenant),
        listTenants()
      ]);
      setUsers(usersRes);
      setTenants(tenantsRes);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [selectedTenant]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.displayName?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.id?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  async function onSave() {
    if (!form.email || !form.displayName) {
      setError("Email and Display Name are required");
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      if (editingUser) {
        await updateAdminUser(editingUser.id, form);
        setSuccess("User updated successfully");
      } else {
        if (!form.password) {
          setError("Password is required for new users");
          setSaving(false);
          return;
        }
        await createAdminUser(form);
        setSuccess("User created successfully");
      }
      setShowForm(false);
      setEditingUser(null);
      setForm({ email: "", password: "", displayName: "", status: "ACTIVE", clientId: "" });
      await refresh();
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save user");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(user: AdminUserResponse) {
    setEditingUser(user);
    setForm({
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      clientId: user.clientId || "",
      password: "" // Don't show password
    });
    setShowForm(true);
  }

  async function onDelete(id: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      setSaving(true);
      await deleteAdminUser(id);
      setSuccess("User deleted successfully");
      await refresh();
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: '32px', background: 'var(--bg-app)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>User Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage platform and tenant administrators</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingUser(null);
            setForm({ email: "", password: "", displayName: "", status: "ACTIVE", clientId: "" });
          }}
          style={{
            background: 'var(--primary)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <Plus size={20} />
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--status-red)', background: 'rgba(239, 68, 68, 0.1)', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ color: 'var(--status-green)', background: 'rgba(34, 197, 94, 0.1)', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
          {success}
        </div>
      )}

      {showForm && (
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', marginBottom: '32px', border: '1px solid var(--border-light)' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 700 }}>{editingUser ? 'Edit User' : 'Create New User'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Display Name</label>
              <input 
                type="text" 
                value={form.displayName} 
                onChange={e => setForm({...form, displayName: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Email Address</label>
              <input 
                type="email" 
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}
              />
            </div>
            {!editingUser && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Password</label>
                <input 
                  type="password" 
                  value={form.password} 
                  onChange={e => setForm({...form, password: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}
                />
              </div>
            )}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Tenant (Optional)</label>
              <select 
                value={form.clientId} 
                onChange={e => setForm({...form, clientId: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}
              >
                <option value="">Platform User (Global)</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <button 
            disabled={saving}
            onClick={onSave}
            style={{ background: 'var(--primary)', color: 'white', padding: '12px 32px', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            {saving ? 'Saving...' : 'Save User'}
          </button>
        </div>
      )}

      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
            />
          </div>
          <select 
             value={selectedTenant}
             onChange={e => setSelectedTenant(e.target.value)}
             style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
          >
            <option value="all">All Tenants</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-muted)', textAlign: 'left' }}>
              <th style={{ padding: '16px', fontSize: '14px', fontWeight: 600 }}>User</th>
              <th style={{ padding: '16px', fontSize: '14px', fontWeight: 600 }}>Tenant</th>
              <th style={{ padding: '16px', fontSize: '14px', fontWeight: 600 }}>Roles</th>
              <th style={{ padding: '16px', fontSize: '14px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '16px', fontSize: '14px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center' }}>Loading users...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center' }}>No users found</td></tr>
            ) : filteredUsers.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <UserCircle size={24} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{user.displayName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  {user.clientId ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                      <Building2 size={14} color="var(--primary)" />
                      {tenants.find(t => t.id === user.clientId)?.name ?? user.clientId}
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-muted)', padding: '2px 8px', borderRadius: '4px' }}>Platform</span>
                  )}
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {user.roles.map(role => (
                      <span key={role} style={{ fontSize: '10px', background: 'rgba(75, 112, 245, 0.1)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        {role}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    fontSize: '12px', 
                    padding: '4px 8px', 
                    borderRadius: '20px', 
                    fontWeight: 600,
                    background: user.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: user.status === 'ACTIVE' ? 'var(--status-green)' : 'var(--status-red)'
                  }}>
                    {user.status}
                  </span>
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button onClick={() => startEdit(user)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'white', cursor: 'pointer' }}>
                      <Edit size={16} />
                    </button>
                    <button onClick={() => onDelete(user.id)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'white', cursor: 'pointer', color: 'var(--status-red)' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
