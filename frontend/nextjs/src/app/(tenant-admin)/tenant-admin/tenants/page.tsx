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
  createPaymentConfig,
  updatePaymentConfig,
  listPaymentConfigs,
  validatePaymentCredentials,
  deactivatePaymentConfig,
  type TenantUpsertInput,
  type TenantResponse,
  type PaymentGatewayType,
  type PaymentGatewayUpdateRequest,
  type PaymentConfigRequest,
  type PaymentConfigResponse
} from "@/lib/api/admin";
import { Building2, Plus, Edit, Trash2, Search, Power, PowerOff, Mail, CreditCard, Settings, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { isTenantAdmin, hasAdminRole } from "@/lib/utils/admin";

const defaultPaymentGateway: PaymentGatewayUpdateRequest = {
  gatewayType: "RAZORPAY",
  apiKey: "",
  secretKey: "",
  webhookSecret: "",
  merchantId: "",
  isActive: false,
  isLiveMode: false,
  additionalConfig: "",
  autoCaptureEnabled: false,
  partialRefundEnabled: false,
  webhookUrl: ""
}

const defaultPaymentConfig: PaymentConfigRequest = {
  gatewayType: "RAZORPAY",
  apiKey: "",
  secretKey: "",
  webhookSecret: "",
  merchantId: "",
  isActive: true,
  isLiveMode: false,
  additionalConfig: "",
  autoCaptureEnabled: true,
  partialRefundEnabled: true,
  webhookUrl: ""
}

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
  const [paymentGatewayForm, setPaymentGatewayForm] = useState<PaymentGatewayUpdateRequest>(defaultPaymentGateway);
  const [configJsonError, setConfigJsonError] = useState<string | null>(null);

  // Payment Config state
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfigResponse[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [showPaymentCredentials, setShowPaymentCredentials] = useState(false);
  const [editingPaymentConfig, setEditingPaymentConfig] = useState<PaymentConfigResponse | null>(null);
  const [validatingConfig, setValidatingConfig] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [paymentConfigForm, setPaymentConfigForm] = useState<PaymentConfigRequest>(defaultPaymentConfig);
  const [paymentConfigJsonError, setPaymentConfigJsonError] = useState<string | null>(null);

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

  async function loadPaymentConfigs(tenantId: string) {
    try {
      setLoadingConfigs(true);
      const configs = await listPaymentConfigs(tenantId, false);
      setPaymentConfigs(configs);
    } catch (e: any) {
      console.error("Failed to load payment configs:", e);
      setPaymentConfigs([]);
    } finally {
      setLoadingConfigs(false);
    }
  }

  async function startEditPaymentGateway(tenant: TenantResponse) {
    setEditingPaymentGateway(tenant);
    setConfigJsonError(null);
    setPaymentConfigJsonError(null);
    setEditingPaymentConfig(null);
    setShowPaymentCredentials(false);
    setShowApiKey(false);
    setShowSecretKey(false);
    setShowWebhookSecret(false);


    //get client_payment_configs for the tenant
    const clientPaymentConfigs = await listPaymentConfigs(tenant.id, false);
    console.log("🚀 ~ startEditPaymentGateway ~ clientPaymentConfigs:", clientPaymentConfigs)
    if (clientPaymentConfigs.length === 0 || clientPaymentConfigs.length === undefined) {
      setPaymentGatewayForm(defaultPaymentGateway);
    } else {
      const clientPaymentConfig = clientPaymentConfigs.find(c => c.clientId === tenant.id)
      if (clientPaymentConfig) {
        setPaymentGatewayForm({
          gatewayType: clientPaymentConfig.gatewayType,
          apiKey: clientPaymentConfig.apiKey,
          secretKey: clientPaymentConfig.secretKey,
          webhookSecret: clientPaymentConfig.webhookSecret,
          merchantId: clientPaymentConfig.merchantId || "",
          isActive: clientPaymentConfig.isActive,
          isLiveMode: clientPaymentConfig.isLiveMode,
          additionalConfig: clientPaymentConfig.additionalConfig,
          autoCaptureEnabled: clientPaymentConfig.autoCaptureEnabled,
          partialRefundEnabled: clientPaymentConfig.partialRefundEnabled,
          webhookUrl: clientPaymentConfig.webhookUrl || "",
        });
      } else {
        setPaymentGatewayForm(defaultPaymentGateway);
      }
    }

    // Reset payment config form (for adding new credentials)
    setPaymentConfigForm(defaultPaymentConfig);

    setShowPaymentGatewayForm(true);
    // Load existing payment configs
    loadPaymentConfigs(tenant.id);
  }

  function cancelPaymentGatewayEdit() {
    setEditingPaymentGateway(null);
    setShowPaymentGatewayForm(false);
    setConfigJsonError(null);
    setPaymentConfigJsonError(null);
    setEditingPaymentConfig(null);
    setShowPaymentCredentials(false);
    setPaymentConfigs([]);
    setPaymentGatewayForm(defaultPaymentGateway);
    setPaymentConfigForm({
      gatewayType: "RAZORPAY",
      apiKey: "",
      secretKey: "",
      webhookSecret: "",
      merchantId: "",
      isActive: true,
      isLiveMode: false,
      additionalConfig: "",
      autoCaptureEnabled: true,
      partialRefundEnabled: true,
      webhookUrl: ""
    });
  }

  function startEditPaymentConfig(config: PaymentConfigResponse) {
    setEditingPaymentConfig(config);
    setShowPaymentCredentials(true);
    setPaymentConfigForm({
      gatewayType: config.gatewayType,
      apiKey: "", // Empty - user needs to re-enter for security
      secretKey: "", // Empty - user needs to re-enter for security
      webhookSecret: "", // Empty - user needs to re-enter for security
      merchantId: config.merchantId || "",
      isActive: config.isActive,
      isLiveMode: config.isLiveMode,
      additionalConfig: "",
      autoCaptureEnabled: true,
      partialRefundEnabled: true,
      webhookUrl: ""
    });
  }

  function cancelPaymentConfigEdit() {
    setEditingPaymentConfig(null);
    setShowPaymentCredentials(false);
    setPaymentConfigJsonError(null);
    setPaymentConfigForm({
      gatewayType: paymentGatewayForm.gatewayType || "RAZORPAY",
      apiKey: "",
      secretKey: "",
      webhookSecret: "",
      merchantId: "",
      isActive: true,
      isLiveMode: false,
      additionalConfig: "",
      autoCaptureEnabled: paymentGatewayForm.autoCaptureEnabled ?? true,
      partialRefundEnabled: paymentGatewayForm.partialRefundEnabled ?? true,
      webhookUrl: paymentGatewayForm.webhookUrl || ""
    });
  }

  async function onSavePaymentConfig() {
    if (!editingPaymentGateway) return;

    // Validate JSON config if provided
    setPaymentConfigJsonError(null);
    let validatedConfig = paymentConfigForm.additionalConfig;
    if (validatedConfig && validatedConfig.trim()) {
      try {
        const parsed = JSON.parse(validatedConfig);
        validatedConfig = JSON.stringify(parsed);
      } catch (e) {
        setPaymentConfigJsonError("Invalid JSON format. Please check your JSON syntax.");
        return;
      }
    }

    if (!paymentConfigForm.apiKey.trim() || !paymentConfigForm.secretKey.trim()) {
      setError("API Key and Secret Key are required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // If this is the default gateway type, sync settings from paymentGatewayForm
      const isDefaultGateway = paymentConfigForm.gatewayType === paymentGatewayForm.gatewayType;
      const finalWebhookUrl = isDefaultGateway && paymentGatewayForm.webhookUrl
        ? paymentGatewayForm.webhookUrl.trim()
        : (paymentConfigForm.webhookUrl?.trim() || undefined);
      const finalAutoCapture = isDefaultGateway
        ? paymentGatewayForm.autoCaptureEnabled
        : paymentConfigForm.autoCaptureEnabled;
      const finalPartialRefund = isDefaultGateway
        ? paymentGatewayForm.partialRefundEnabled
        : paymentConfigForm.partialRefundEnabled;
      const finalAdditionalConfig = isDefaultGateway && paymentGatewayForm.additionalConfig
        ? paymentGatewayForm.additionalConfig.trim()
        : validatedConfig;

      if (editingPaymentConfig) {
        // Update existing config
        await updatePaymentConfig(editingPaymentConfig.id, {
          ...paymentConfigForm,
          webhookSecret: paymentConfigForm.webhookSecret?.trim() || undefined,
          merchantId: paymentConfigForm.merchantId?.trim() || undefined,
          webhookUrl: finalWebhookUrl,
          additionalConfig: finalAdditionalConfig || undefined,
          autoCaptureEnabled: finalAutoCapture,
          partialRefundEnabled: finalPartialRefund,
          isActive: isDefaultGateway ? paymentGatewayForm.isActive : paymentConfigForm.isActive
        });
        setSuccess({ message: `Payment configuration updated successfully` });
      } else {
        // Create new config
        await createPaymentConfig(editingPaymentGateway.id, {
          ...paymentConfigForm,
          webhookSecret: paymentConfigForm.webhookSecret?.trim() || undefined,
          merchantId: paymentConfigForm.merchantId?.trim() || undefined,
          webhookUrl: finalWebhookUrl,
          additionalConfig: finalAdditionalConfig || undefined,
          autoCaptureEnabled: finalAutoCapture,
          partialRefundEnabled: finalPartialRefund,
          isActive: isDefaultGateway ? paymentGatewayForm.isActive : paymentConfigForm.isActive
        });
        setSuccess({ message: `Payment configuration created successfully` });
      }

      setEditingPaymentConfig(null);
      setShowPaymentCredentials(false);
      setPaymentConfigForm({
        gatewayType: paymentGatewayForm.gatewayType || "RAZORPAY",
        apiKey: "",
        secretKey: "",
        webhookSecret: "",
        merchantId: "",
        isActive: true,
        isLiveMode: false,
        additionalConfig: "",
        autoCaptureEnabled: paymentGatewayForm.autoCaptureEnabled ?? true,
        partialRefundEnabled: paymentGatewayForm.partialRefundEnabled ?? true,
        webhookUrl: paymentGatewayForm.webhookUrl || ""
      });

      await loadPaymentConfigs(editingPaymentGateway.id);
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save payment configuration");
    } finally {
      setSaving(false);
    }
  }

  async function onValidatePaymentConfig(config: PaymentConfigResponse) {
    if (!editingPaymentGateway) return;
    try {
      setValidatingConfig(config.id);
      setError(null);
      const result = await validatePaymentCredentials(editingPaymentGateway.id, config.gatewayType);
      if (result.valid) {
        setSuccess({ message: `Credentials for ${config.gatewayType} are valid` });
      } else {
        setError(`Credentials for ${config.gatewayType} are invalid`);
      }
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    } catch (e: any) {
      setError(e?.message ?? "Failed to validate credentials");
      setTimeout(() => setError(null), 5000);
    } finally {
      setValidatingConfig(null);
    }
  }

  async function onDeletePaymentConfig(config: PaymentConfigResponse) {
    if (!editingPaymentGateway) return;

    if (!confirm(`Are you sure you want to delete the ${config.gatewayType} payment configuration? This action cannot be undone.`)) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await deactivatePaymentConfig(editingPaymentGateway.id, config.gatewayType);
      setSuccess({ message: `Payment configuration deleted successfully` });
      await loadPaymentConfigs(editingPaymentGateway.id);
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete payment configuration");
    } finally {
      setSaving(false);
    }
  }

  async function onUpdatePaymentGateway() {
    if (!editingPaymentGateway) return;

    // Validate JSON config if provided
    setConfigJsonError(null);
    let validatedConfig = paymentGatewayForm.additionalConfig;
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

      // Update via the tenant payment gateway endpoint
      await updateTenantPaymentGateway(editingPaymentGateway.id, {
        ...paymentGatewayForm,
        additionalConfig: validatedConfig || undefined
      });

      setEditingPaymentGateway(null);
      setShowPaymentGatewayForm(false);
      await refresh();
      await loadPaymentConfigs(editingPaymentGateway.id);
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
      {editingPaymentGateway && isTenantAdmin() && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '32px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
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

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
              Close
            </button>
          </div>
              </div>
          {/* Current Payment Configuration */}
          {loadingConfigs ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading payment configuration...
            </div>
          ) : paymentConfigs.length > 0 ? (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
                Current Payment Configuration
              </h4>
              <div style={{
                padding: '20px',
                background: 'var(--bg-app)',
                borderRadius: '12px',
                border: '1px solid var(--border-light)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        padding: '8px 16px',
                        background: 'var(--primary)',
                        color: 'white',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '14px'
                      }}>
                        {paymentConfigs[0].gatewayType.replace('_', ' ')}
                      </div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: paymentConfigs[0].isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: paymentConfigs[0].isActive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
                      }}>
                        {paymentConfigs[0].isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: paymentConfigs[0].isLiveMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: paymentConfigs[0].isLiveMode ? 'rgb(59, 130, 246)' : 'rgb(245, 158, 11)'
                      }}>
                        {paymentConfigs[0].isLiveMode ? 'Live Mode' : 'Test Mode'}
                      </span>
                    </div>
                    {paymentConfigs[0].merchantId && (
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <strong>Merchant ID:</strong> {paymentConfigs[0].merchantId}
                      </div>
                    )}
                    {paymentConfigs[0].webhookUrl && (
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <strong>Webhook URL:</strong> {paymentConfigs[0].webhookUrl}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Created: {new Date(paymentConfigs[0].createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => onValidatePaymentConfig(paymentConfigs[0])}
                      disabled={validatingConfig === paymentConfigs[0].id || saving}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        cursor: (validatingConfig === paymentConfigs[0].id || saving) ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <CheckCircle2 size={16} />
                      {validatingConfig === paymentConfigs[0].id ? 'Validating...' : 'Validate'}
                    </button>
                    <button
                      onClick={() => onDeletePaymentConfig(paymentConfigs[0])}
                      disabled={saving}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'rgb(239, 68, 68)',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Info message about editing */}
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} color="#3b82f6" />
                  <span>To update credentials, delete the current configuration and create a new one. This ensures secure handling of sensitive API keys.</span>
                </div>
              </div>
            </div>
          ) : (
            /* Show Add Form when no config exists */
            null
          )}

          {/* Payment Credentials Form - Only show when no config exists */}
          {!loadingConfigs && paymentConfigs.length === 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
                Add Payment Configuration
              </h4>
              <div style={{
                padding: '20px',
                background: 'var(--bg-app)',
                borderRadius: '12px',
                border: '1px solid var(--border-light)'
              }}>

                <div style={{
                  marginBottom: '16px',
                  padding: '12px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} color="#3b82f6" />
                  <span>Configure your payment gateway credentials below. Each tenant can have one payment configuration at a time.</span>
                </div>


                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}>
                      Gateway Type *
                    </label>
                    <select
                      value={paymentConfigForm.gatewayType}
                      onChange={(e) => setPaymentConfigForm((f) => ({ ...f, gatewayType: e.target.value as PaymentGatewayType }))}
                      disabled={!!editingPaymentConfig}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-light)',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        background: editingPaymentConfig ? 'var(--bg-app)' : 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        opacity: editingPaymentConfig ? 0.6 : 1
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
                      API Key *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showApiKey ? "text" : "password"}
                        placeholder="sk_test_..."
                        autoComplete="new-password"
                        value={paymentConfigForm.apiKey}
                        onChange={(e) => setPaymentConfigForm((f) => ({ ...f, apiKey: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          paddingRight: '40px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-light)',
                          fontSize: '14px',
                          fontFamily: 'inherit'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}>
                      Secret Key *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showSecretKey ? "text" : "password"}
                        placeholder="sk_test_..."
                        value={paymentConfigForm.secretKey}
                        onChange={(e) => setPaymentConfigForm((f) => ({ ...f, secretKey: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          paddingRight: '40px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-light)',
                          fontSize: '14px',
                          fontFamily: 'inherit'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {showSecretKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}>
                      Webhook Secret
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showWebhookSecret ? "text" : "password"}
                        placeholder="whsec_..."
                        value={paymentConfigForm.webhookSecret}
                        onChange={(e) => setPaymentConfigForm((f) => ({ ...f, webhookSecret: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          paddingRight: '40px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-light)',
                          fontSize: '14px',
                          fontFamily: 'inherit'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {showWebhookSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}>
                      Merchant ID
                    </label>
                    <input
                      type="text"
                      placeholder="acct_..."
                      value={paymentConfigForm.merchantId}
                      onChange={(e) => setPaymentConfigForm((f) => ({ ...f, merchantId: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-light)',
                        fontSize: '14px',
                        fontFamily: 'inherit'
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
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://your-domain.com/webhooks/payment"
                      value={paymentConfigForm.webhookUrl}
                      onChange={(e) => setPaymentConfigForm((f) => ({ ...f, webhookUrl: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-light)',
                        fontSize: '14px',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}>
                    Additional Config (JSON) - Optional
                  </label>
                  <textarea
                    placeholder='{"refund_policy": "30_days", "max_refund_amount": 50000}'
                    value={paymentConfigForm.additionalConfig || ""}
                    onChange={(e) => {
                      setPaymentConfigForm((f) => ({ ...f, additionalConfig: e.target.value }));
                      setPaymentConfigJsonError(null);
                    }}
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: paymentConfigJsonError ? '1px solid var(--status-red)' : '1px solid var(--border-light)',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      resize: 'vertical'
                    }}
                  />
                  {paymentConfigJsonError && (
                    <div style={{
                      marginTop: '8px',
                      color: 'var(--status-red)',
                      fontSize: '12px'
                    }}>
                      {paymentConfigJsonError}
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '16px'
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
                      checked={paymentConfigForm.isActive}
                      onChange={(e) => setPaymentConfigForm((f) => ({ ...f, isActive: e.target.checked }))}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <span>Active</span>
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
                      checked={paymentConfigForm.isLiveMode}
                      onChange={(e) => setPaymentConfigForm((f) => ({ ...f, isLiveMode: e.target.checked }))}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <span>Live Mode (Production)</span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button
                    onClick={onSavePaymentConfig}
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
                    {saving ? "Saving..." : "Save Configuration"}
                  </button>
                </div>
              </div>
            </div>
          )}
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
