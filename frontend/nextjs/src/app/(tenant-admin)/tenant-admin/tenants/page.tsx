"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createTenant,
  deleteTenant,
  listTenants,
  updateTenant,
  activateTenant,
  deactivateTenant,
  updateTenantPaymentGateway,
  toggleTenantPayments,
  getSupportedGatewayTypes,
  type TenantUpsertInput,
  type TenantResponse,
  type PaymentGatewayType,
  type PaymentGatewayUpdateRequest
} from "@/lib/api/admin";
import { Building2, Plus, Edit, Trash2, Search, Power, PowerOff, Mail, CreditCard, Settings } from "lucide-react";
import { isTenantAdmin, hasAdminRole } from "@/lib/utils/admin";

export default function TenantsPage() {
  useEffect(() => {
    const t = localStorage.getItem("fg_tenant_admin_access_token");
    if (!t) {
      if (typeof globalThis !== 'undefined' && globalThis.location) {
        globalThis.location.href = "/tenant-admin-login";
      }
      return;
    }
    
    // Only tenant admin can access this page
    if (!isTenantAdmin()) {
      if (typeof globalThis !== 'undefined' && globalThis.location) {
        globalThis.location.href = "/admin-login";
      }
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; adminEmail?: string; adminPassword?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantResponse | null>(null);
  const [showPaymentGatewayForm, setShowPaymentGatewayForm] = useState(false);
  const [editingPaymentGateway, setEditingPaymentGateway] = useState<TenantResponse | null>(null);
  const [gatewayTypes, setGatewayTypes] = useState<PaymentGatewayType[]>([]);
  const [paymentGatewayForm, setPaymentGatewayForm] = useState<PaymentGatewayUpdateRequest>({
    defaultGatewayType: "RAZORPAY",
    paymentEnabled: false,
    autoCaptureEnabled: false,
    partialRefundEnabled: false,
    webhookUrl: "",
    paymentGatewayConfig: ""
  });
  const [configJsonError, setConfigJsonError] = useState<string | null>(null);

  const [form, setForm] = useState<TenantUpsertInput>({ 
    name: "", 
    contactEmail: "",
    status: "ACTIVE",
    adminEmail: "",
    adminPassword: "",
    adminDisplayName: ""
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
    loadGatewayTypes();
  }, []);

  async function loadGatewayTypes() {
    try {
      const types = await getSupportedGatewayTypes();
      setGatewayTypes(types);
    } catch (e) {
      console.error("Failed to load gateway types:", e);
    }
  }

  async function onCreate() {
    if (!canSubmit) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const result = await createTenant(form);
      console.log("🚀 ~ onCreate ~ result:", result)
      setForm({ name: "", contactEmail: "", status: "ACTIVE", adminEmail: "", adminPassword: "", adminDisplayName: "" });
      setShowForm(false);
      
      // Show success message with admin user info
      if (result.adminEmail) {
        setSuccess({
          message: `Tenant "${result.name}" created successfully!`,
          adminEmail: result.adminEmail,
          adminPassword: result.adminPassword ?? "Check backend logs for generated password"
        });
      } else {
        setSuccess({
          message: `Tenant "${result.name}" created successfully!`
        });
      }
      
      await refresh();
      
      // Clear success message after 10 seconds
      setTimeout(() => setSuccess(null), 10000);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create tenant");
      setSuccess(null);
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
      setForm({ name: "", contactEmail: "", status: "ACTIVE", adminEmail: "", adminPassword: "", adminDisplayName: "" });
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update tenant");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(tenant: TenantResponse) {
    setEditingTenant(tenant);
    setForm({
      name: tenant.name || "",
      contactEmail: tenant.contactEmail || "",
      status: tenant.status || "ACTIVE",
      adminEmail: tenant.adminEmail || "",
      adminPassword: "",
      adminDisplayName: tenant.adminDisplayName || ""
    });
    setShowForm(false);
  }

  function startEditPaymentGateway(tenant: TenantResponse) {
    setEditingPaymentGateway(tenant);
    setConfigJsonError(null);
    // Format JSON config for editing if it exists
    let formattedConfig = "";
    if (tenant.paymentGatewayConfig) {
      try {
        const parsed = JSON.parse(tenant.paymentGatewayConfig);
        formattedConfig = JSON.stringify(parsed, null, 2);
      } catch {
        formattedConfig = tenant.paymentGatewayConfig;
      }
    }
    setPaymentGatewayForm({
      defaultGatewayType: tenant.defaultGatewayType || "RAZORPAY",
      paymentEnabled: tenant.paymentEnabled || false,
      autoCaptureEnabled: tenant.autoCaptureEnabled || false,
      partialRefundEnabled: tenant.partialRefundEnabled || false,
      webhookUrl: tenant.webhookUrl || "",
      paymentGatewayConfig: formattedConfig
    });
    setShowPaymentGatewayForm(true);
  }

  function cancelPaymentGatewayEdit() {
    setEditingPaymentGateway(null);
    setShowPaymentGatewayForm(false);
    setConfigJsonError(null);
    setPaymentGatewayForm({
      defaultGatewayType: "RAZORPAY",
      paymentEnabled: false,
      autoCaptureEnabled: false,
      partialRefundEnabled: false,
      webhookUrl: "",
      paymentGatewayConfig: ""
    });
  }

  async function onUpdatePaymentGateway() {
    if (!editingPaymentGateway) return;
    
    // Validate JSON config if provided
    setConfigJsonError(null);
    let validatedConfig = paymentGatewayForm.paymentGatewayConfig;
    if (validatedConfig && validatedConfig.trim()) {
      try {
        const parsed = JSON.parse(validatedConfig);
        validatedConfig = JSON.stringify(parsed); // Normalize JSON
      } catch (e) {
        setConfigJsonError("Invalid JSON format. Please check your JSON syntax.");
        return;
      }
    }
    
    try {
      setSaving(true);
      setError(null);
      await updateTenantPaymentGateway(editingPaymentGateway.id, {
        ...paymentGatewayForm,
        paymentGatewayConfig: validatedConfig || undefined
      });
      setEditingPaymentGateway(null);
      setShowPaymentGatewayForm(false);
      await refresh();
      setSuccess({ message: `Payment gateway settings updated for "${editingPaymentGateway.name}"` });
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(e?.message ?? "Failed to update payment gateway");
    } finally {
      setSaving(false);
    }
  }

  async function onTogglePayments(tenantId: string, enabled: boolean) {
    try {
      setSaving(true);
      setError(null);
      await toggleTenantPayments(tenantId, enabled);
      await refresh();
      setSuccess({ message: `Payments ${enabled ? 'enabled' : 'disabled'} successfully` });
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(e?.message ?? `Failed to ${enabled ? 'enable' : 'disable'} payments`);
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditingTenant(null);
    setForm({ name: "", contactEmail: "", status: "ACTIVE", adminEmail: "", adminPassword: "", adminDisplayName: "" });
  }

  async function onDelete(id: string) {
    const tenant = tenants.find(t => t.id === id);
    const tenantName = tenant?.name || "this tenant";
    
    if (!confirm(`Are you sure you want to permanently delete "${tenantName}"? This action cannot be undone and will also delete the associated admin user.`)) {
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await deleteTenant(id);
      setSuccess({ message: `Tenant "${tenantName}" has been permanently deleted` });
      await refresh();
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete tenant");
      setSuccess(null);
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

      {success && (
        <div style={{ 
          color: 'rgb(34, 197, 94)', 
          background: 'rgba(34, 197, 94, 0.1)',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          fontSize: '14px',
          border: '1px solid rgba(34, 197, 94, 0.2)'
        }}>
          <div style={{ fontWeight: 600, marginBottom: success.adminEmail ? '8px' : '0' }}>
            {success.message}
          </div>
          {success.adminEmail && (
            <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '8px', fontSize: '13px' }}>
              <div style={{ marginBottom: '8px', fontWeight: 600 }}>Client Admin User Created:</div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Email:</strong> {success.adminEmail}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Password:</strong> {success.adminPassword}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>
                Note: A default password was generated. The client admin should reset their password on first login.
              </div>
            </div>
          )}
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
          {!editingTenant && (
            <div style={{ 
              marginTop: '20px',
              padding: '16px',
              background: 'rgba(75, 112, 245, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(75, 112, 245, 0.2)',
              marginBottom: '20px'
            }}>
              <h4 style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                marginBottom: '12px',
                color: 'var(--text-primary)'
              }}>
                Admin User (Optional)
              </h4>
              <p style={{ 
                fontSize: '12px', 
                color: 'var(--text-muted)', 
                marginBottom: '16px' 
              }}>
                If not provided, a default admin user will be created automatically with a generated email and password.
              </p>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '16px'
              }}>
                <div>
                  <label style={{ 
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}>
                    Admin Email
                  </label>
                  <input
                    type="email"
                    placeholder="admin@example.com (optional)"
                    value={form.adminEmail}
                    onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
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
                    Admin Password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Leave empty for auto-generated"
                    value={form.adminPassword}
                    onChange={(e) => setForm((f) => ({ ...f, adminPassword: e.target.value }))}
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
                    Admin Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe (optional)"
                    value={form.adminDisplayName}
                    onChange={(e) => setForm((f) => ({ ...f, adminDisplayName: e.target.value }))}
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
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
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

      {/* Payment Gateway Form */}
      { editingPaymentGateway && isTenantAdmin() && (
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
            <CreditCard size={24} color="var(--primary)" />
            Payment Gateway Settings - {editingPaymentGateway.name}
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
                Payment Gateway Type *
              </label>
              <select
                value={paymentGatewayForm.defaultGatewayType}
                onChange={(e) => setPaymentGatewayForm((f) => ({ ...f, defaultGatewayType: e.target.value as PaymentGatewayType }))}
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
                {gatewayTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                Webhook URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/webhook"
                value={paymentGatewayForm.webhookUrl}
                onChange={(e) => setPaymentGatewayForm((f) => ({ ...f, webhookUrl: e.target.value }))}
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
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}>
              Payment Gateway Config (JSON)
            </label>
            <p style={{ 
              fontSize: '12px', 
              color: 'var(--text-muted)', 
              marginBottom: '8px' 
            }}>
              Enter gateway-specific configuration as JSON. Example for Razorpay: {"{"}"razorpay_key": "rzp_...", "razorpay_secret": "..."{"}"}
            </p>
            <textarea
              placeholder='{"razorpay_key": "rzp_...", "razorpay_secret": "..."}'
              value={paymentGatewayForm.paymentGatewayConfig || ""}
              onChange={(e) => {
                setPaymentGatewayForm((f) => ({ ...f, paymentGatewayConfig: e.target.value }));
                setConfigJsonError(null);
              }}
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '12px 16px',
                borderRadius: '10px',
                border: configJsonError ? '1px solid var(--status-red)' : '1px solid var(--border-light)',
                fontSize: '13px',
                fontFamily: 'monospace',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                transition: 'all 0.2s ease',
                resize: 'vertical'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = configJsonError ? 'var(--status-red)' : 'var(--primary)';
                e.currentTarget.style.outline = 'none';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = configJsonError ? 'var(--status-red)' : 'var(--border-light)';
              }}
            />
            {configJsonError && (
              <div style={{ 
                marginTop: '8px',
                color: 'var(--status-red)',
                fontSize: '12px'
              }}>
                {configJsonError}
              </div>
            )}
          </div>
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              <input
                type="checkbox"
                checked={paymentGatewayForm.paymentEnabled}
                onChange={(e) => setPaymentGatewayForm((f) => ({ ...f, paymentEnabled: e.target.checked }))}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <span>Enable Payments</span>
            </label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              <input
                type="checkbox"
                checked={paymentGatewayForm.autoCaptureEnabled}
                onChange={(e) => setPaymentGatewayForm((f) => ({ ...f, autoCaptureEnabled: e.target.checked }))}
                disabled={!paymentGatewayForm.paymentEnabled}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: paymentGatewayForm.paymentEnabled ? 'pointer' : 'not-allowed',
                  opacity: paymentGatewayForm.paymentEnabled ? 1 : 0.5
                }}
              />
              <span>Auto Capture Enabled</span>
            </label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              <input
                type="checkbox"
                checked={paymentGatewayForm.partialRefundEnabled}
                onChange={(e) => setPaymentGatewayForm((f) => ({ ...f, partialRefundEnabled: e.target.checked }))}
                disabled={!paymentGatewayForm.paymentEnabled}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: paymentGatewayForm.paymentEnabled ? 'pointer' : 'not-allowed',
                  opacity: paymentGatewayForm.paymentEnabled ? 1 : 0.5
                }}
              />
              <span>Partial Refund Enabled</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onUpdatePaymentGateway}
              disabled={saving}
              style={{
                background: 'var(--primary)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '14px',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: saving ? 0.6 : 1
              }}
            >
              {saving ? "Updating..." : "Update Payment Gateway"}
            </button>
            <button
              onClick={cancelPaymentGatewayEdit}
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
          autoComplete="off"
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
                    Admin User
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
                    Payment Gateway
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
                      fontSize: '14px',
                      color: 'var(--text-primary)'
                    }}>
                      {tenant.adminEmail ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: 600 }}>{tenant.adminDisplayName || 'N/A'}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tenant.adminEmail}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No admin user</span>
                      )}
                    </td>
                    <td style={{ 
                      padding: '20px',
                      fontSize: '14px',
                      color: 'var(--text-primary)'
                    }}>
                      {tenant.paymentEnabled ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CreditCard size={14} />
                            <span style={{ fontWeight: 600 }}>
                              {tenant.defaultGatewayType ? tenant.defaultGatewayType.replace('_', ' ') : 'Not configured'}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: 'rgba(34, 197, 94, 0.1)',
                              color: 'rgb(34, 197, 94)'
                            }}>
                              Enabled
                            </span>
                          </div>
                          {tenant.autoCaptureEnabled && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              Auto-capture: ON
                            </span>
                          )}
                          {tenant.partialRefundEnabled && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              Partial refund: ON
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Payments disabled</span>
                      )}
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
                        {isTenantAdmin() && (
                          <button
                            onClick={() => startEditPaymentGateway(tenant)}
                            disabled={saving || editingPaymentGateway?.id === tenant.id}
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
                            <Settings size={14} />
                            Payment
                          </button>
                        )}
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
