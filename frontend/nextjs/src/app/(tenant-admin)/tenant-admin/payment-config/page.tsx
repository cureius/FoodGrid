"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createPaymentConfig,
  updatePaymentConfig,
  listPaymentConfigs,
  deactivatePaymentConfig,
  reactivatePaymentConfig,
  validatePaymentCredentials,
  getSupportedGateways,
  getSupportedGatewayTypes,
  listTenants,
  type PaymentConfigRequest,
  type PaymentConfigResponse,
  type PaymentGatewayType,
  type TenantResponse,
  type GatewayTypeInfo,
} from "@/lib/api/admin";
import { CreditCard, Plus, Edit, Search, Power, PowerOff, CheckCircle2, XCircle, AlertCircle, Settings, Building2 } from "lucide-react";
import { isTenantAdmin } from "@/lib/utils/admin";

export default function PaymentConfigPage() {
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
  const [validating, setValidating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [configs, setConfigs] = useState<PaymentConfigResponse[]>([]);
  const [gatewayTypes, setGatewayTypes] = useState<PaymentGatewayType[]>([]);
  const [gatewayInfos, setGatewayInfos] = useState<GatewayTypeInfo[]>([]);
  const [activeOnly, setActiveOnly] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PaymentConfigResponse | null>(null);
  const [form, setForm] = useState<PaymentConfigRequest>({
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
    webhookUrl: "",
  });
  const [configJsonError, setConfigJsonError] = useState<string | null>(null);

  const selectedTenant = useMemo(() => {
    return tenants.find(t => t.id === selectedTenantId);
  }, [tenants, selectedTenantId]);

  const filteredConfigs = useMemo(() => {
    if (!searchQuery.trim()) return configs;
    const query = searchQuery.toLowerCase();
    return configs.filter(
      (c) =>
        c.gatewayType?.toLowerCase().includes(query) ||
        c.id?.toLowerCase().includes(query) ||
        c.merchantId?.toLowerCase().includes(query)
    );
  }, [configs, searchQuery]);

  async function refreshTenants() {
    try {
      const res = await listTenants();
      setTenants(res);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load tenants");
    }
  }

  async function refreshConfigs() {
    if (!selectedTenantId) {
      setConfigs([]);
      return;
    }
    try {
      setLoading(true);
      const res = await listPaymentConfigs(selectedTenantId, activeOnly);
      setConfigs(res);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load payment configurations");
    } finally {
      setLoading(false);
    }
  }

  async function loadGatewayTypes() {
    try {
      const types = await getSupportedGatewayTypes();
      setGatewayTypes(types);
    } catch (e) {
      console.error("Failed to load gateway types:", e);
    }
  }

  async function loadGatewayInfos() {
    try {
      const infos = await getSupportedGateways();
      setGatewayInfos(infos);
    } catch (e) {
      console.error("Failed to load gateway info:", e);
    }
  }

  useEffect(() => {
    refreshTenants();
    loadGatewayTypes();
    loadGatewayInfos();
  }, []);

  useEffect(() => {
    refreshConfigs();
  }, [selectedTenantId, activeOnly]);

  async function onCreate() {
    if (!selectedTenantId) {
      setError("Please select a tenant first");
      return;
    }
    
    // Validate JSON config if provided
    setConfigJsonError(null);
    let validatedConfig = form.additionalConfig;
    if (validatedConfig && validatedConfig.trim()) {
      try {
        const parsed = JSON.parse(validatedConfig);
        validatedConfig = JSON.stringify(parsed);
      } catch (e) {
        setConfigJsonError("Invalid JSON format. Please check your JSON syntax.");
        return;
      }
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await createPaymentConfig(selectedTenantId, {
        ...form,
        webhookSecret: form.webhookSecret?.trim() || undefined,
        merchantId: form.merchantId?.trim() || undefined,
        webhookUrl: form.webhookUrl?.trim() || undefined,
        additionalConfig: validatedConfig || undefined
      });
      setForm({
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
        webhookUrl: "",
      });
      setShowForm(false);
      await refreshConfigs();
      setSuccess("Payment configuration created successfully");
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create payment configuration");
    } finally {
      setSaving(false);
    }
  }

  async function onUpdate() {
    if (!editingConfig) return;
    
    // Validate JSON config if provided
    setConfigJsonError(null);
    let validatedConfig = form.additionalConfig;
    if (validatedConfig && validatedConfig.trim()) {
      try {
        const parsed = JSON.parse(validatedConfig);
        validatedConfig = JSON.stringify(parsed);
      } catch (e) {
        setConfigJsonError("Invalid JSON format. Please check your JSON syntax.");
        return;
      }
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await updatePaymentConfig(editingConfig.id, {
        ...form,
        webhookSecret: form.webhookSecret?.trim() || undefined,
        merchantId: form.merchantId?.trim() || undefined,
        webhookUrl: form.webhookUrl?.trim() || undefined,
        additionalConfig: validatedConfig || undefined
      });
      setEditingConfig(null);
      setForm({
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
        webhookUrl: "",
      });
      await refreshConfigs();
      setSuccess("Payment configuration updated successfully");
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(e?.message ?? "Failed to update payment configuration");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(config: PaymentConfigResponse) {
    setEditingConfig(config);
    // Note: We can't retrieve the actual API keys/secrets for security reasons
    // So we'll only populate the non-sensitive fields
    setForm({
      gatewayType: config.gatewayType,
      apiKey: "", // Empty - user needs to re-enter
      secretKey: "", // Empty - user needs to re-enter
      webhookSecret: "", // Empty - user needs to re-enter
      merchantId: config.merchantId || "",
      isActive: config.isActive,
      isLiveMode: config.isLiveMode,
      additionalConfig: "",
      autoCaptureEnabled: true,
      partialRefundEnabled: true,
      webhookUrl: "",
    });
    setShowForm(true);
  }

  function cancelEdit() {
    setEditingConfig(null);
    setShowForm(false);
    setConfigJsonError(null);
    setForm({
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
      webhookUrl: "",
    });
  }

  async function onDeactivate(config: PaymentConfigResponse) {
    if (!confirm(`Are you sure you want to deactivate this payment configuration for ${config.gatewayType}?`)) {
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await deactivatePaymentConfig(config.id);
      await refreshConfigs();
      setSuccess(`Payment configuration for ${config.gatewayType} deactivated successfully`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(e?.message ?? "Failed to deactivate payment configuration");
    } finally {
      setSaving(false);
    }
  }

  async function onReactivate(config: PaymentConfigResponse) {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await reactivatePaymentConfig(config.id);
      await refreshConfigs();
      setSuccess(`Payment configuration for ${config.gatewayType} reactivated successfully`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(e?.message ?? "Failed to reactivate payment configuration");
    } finally {
      setSaving(false);
    }
  }

  async function onValidate(config: PaymentConfigResponse) {
    try {
      setValidating(config.id);
      setError(null);
      const result = await validatePaymentCredentials(config.clientId, config.gatewayType);
      if (result.valid) {
        setSuccess(`Credentials for ${config.gatewayType} are valid`);
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
      setValidating(null);
    }
  }

  return (
    <div style={{ 
      padding: '32px', 
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
            Payment Gateway Settings
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
            Configure and manage payment gateway credentials for tenants
          </p>
        </div>
        {selectedTenantId && !showForm && (
          <button
            onClick={() => {
              setShowForm(true);
              setEditingConfig(null);
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
            Add Payment Config
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
          border: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
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
          border: '1px solid rgba(34, 197, 94, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      {/* Tenant Selection */}
      <div style={{ 
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '32px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
      }}>
        <label style={{ 
          display: 'block',
          marginBottom: '12px',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-primary)'
        }}>
          Select Tenant
        </label>
        <select
          value={selectedTenantId}
          onChange={(e) => {
            setSelectedTenantId(e.target.value);
            setShowForm(false);
            setEditingConfig(null);
          }}
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
        >
          <option value="">-- Select a tenant --</option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name} ({tenant.id})
            </option>
          ))}
        </select>
        {selectedTenant && (
          <div style={{ 
            marginTop: '12px',
            padding: '12px',
            background: 'rgba(75, 112, 245, 0.05)',
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Building2 size={16} />
            <span><strong>Tenant:</strong> {selectedTenant.name} | <strong>Email:</strong> {selectedTenant.contactEmail || 'N/A'}</span>
          </div>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && selectedTenantId && (
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
            {editingConfig ? 'Edit Payment Configuration' : 'Create Payment Configuration'}
          </h3>
          
          {editingConfig && (
            <div style={{ 
              marginBottom: '20px',
              padding: '12px 16px',
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '10px',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              fontSize: '13px',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} color="var(--warning)" />
              <span><strong>Note:</strong> For security reasons, API keys and secrets are encrypted and cannot be retrieved. Please re-enter all credentials to update this configuration.</span>
            </div>
          )}
          
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
                Gateway Type *
              </label>
              <select
                value={form.gatewayType}
                onChange={(e) => setForm((f) => ({ ...f, gatewayType: e.target.value as PaymentGatewayType }))}
                disabled={!!editingConfig}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  background: editingConfig ? 'var(--bg-app)' : 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease',
                  opacity: editingConfig ? 0.6 : 1
                }}
              >
                {gatewayTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll('_', ' ')}
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
              <input
                type="password"
                placeholder="sk_test_..."
                value={form.apiKey}
                onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease'
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
                Secret Key *
              </label>
              <input
                type="password"
                placeholder="sk_test_..."
                value={form.secretKey}
                onChange={(e) => setForm((f) => ({ ...f, secretKey: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease'
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
                Webhook Secret
              </label>
              <input
                type="password"
                placeholder="whsec_..."
                value={form.webhookSecret}
                onChange={(e) => setForm((f) => ({ ...f, webhookSecret: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease'
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
                Merchant ID
              </label>
              <input
                type="text"
                placeholder="acct_..."
                value={form.merchantId}
                onChange={(e) => setForm((f) => ({ ...f, merchantId: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease'
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
                value={form.webhookUrl}
                onChange={(e) => setForm((f) => ({ ...f, webhookUrl: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease'
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
              Additional Config (JSON) - Optional
            </label>
            <textarea
              placeholder='{"refund_policy": "30_days", "max_refund_amount": 50000}'
              value={form.additionalConfig || ""}
              onChange={(e) => {
                setForm((f) => ({ ...f, additionalConfig: e.target.value }));
                setConfigJsonError(null);
              }}
              style={{
                width: '100%',
                minHeight: '100px',
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
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
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
                checked={form.isLiveMode}
                onChange={(e) => setForm((f) => ({ ...f, isLiveMode: e.target.checked }))}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <span>Live Mode (Production)</span>
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
                checked={form.autoCaptureEnabled}
                onChange={(e) => setForm((f) => ({ ...f, autoCaptureEnabled: e.target.checked }))}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
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
                checked={form.partialRefundEnabled}
                onChange={(e) => setForm((f) => ({ ...f, partialRefundEnabled: e.target.checked }))}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <span>Partial Refund Enabled</span>
            </label>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={editingConfig ? onUpdate : onCreate}
              disabled={saving || !form.apiKey.trim() || !form.secretKey.trim()}
              style={{
                background: (saving || !form.apiKey.trim() || !form.secretKey.trim()) ? 'var(--border-light)' : 'var(--primary)',
                color: (saving || !form.apiKey.trim() || !form.secretKey.trim()) ? 'var(--text-muted)' : 'white',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '14px',
                border: 'none',
                cursor: (saving || !form.apiKey.trim() || !form.secretKey.trim()) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {saving ? (editingConfig ? "Updating..." : "Creating...") : (editingConfig ? "Update Configuration" : "Create Configuration")}
            </button>
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
          </div>
        </div>
      )}

      {/* Configurations List */}
      {selectedTenantId && (
        <>
          {/* Filters */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ 
              position: 'relative',
              flex: '1',
              minWidth: '300px'
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
                placeholder="Search configurations..."
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
              />
            </div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <span>Active Only</span>
            </label>
          </div>

          {/* Configurations Table */}
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
                Loading configurations...
              </div>
            ) : filteredConfigs.length === 0 ? (
              <div style={{ 
                padding: '60px', 
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                {searchQuery ? 'No configurations found matching your search.' : 'No payment configurations yet. Create your first configuration to get started.'}
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
                        Gateway Type
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
                        Merchant ID
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
                        Mode
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
                        Created
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
                    {filteredConfigs.map((config, idx) => (
                      <tr 
                        key={config.id}
                        style={{ 
                          borderBottom: idx < filteredConfigs.length - 1 ? '1px solid var(--border-light)' : 'none',
                          transition: 'background 0.2s ease',
                          opacity: !config.isActive ? 0.7 : 1
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CreditCard size={16} />
                            {config.gatewayType.replaceAll('_', ' ')}
                          </div>
                        </td>
                        <td style={{ 
                          padding: '20px',
                          fontSize: '14px',
                          color: 'var(--text-muted)',
                          fontFamily: 'monospace'
                        }}>
                          {config.merchantId || 'N/A'}
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
                            background: config.isActive 
                              ? 'rgba(34, 197, 94, 0.1)' 
                              : 'rgba(239, 68, 68, 0.1)',
                            color: config.isActive 
                              ? 'rgb(34, 197, 94)' 
                              : 'rgb(239, 68, 68)'
                          }}>
                            {config.isActive ? 'Active' : 'Inactive'}
                          </span>
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
                            background: config.isLiveMode 
                              ? 'rgba(239, 68, 68, 0.1)' 
                              : 'rgba(59, 130, 246, 0.1)',
                            color: config.isLiveMode 
                              ? 'rgb(239, 68, 68)' 
                              : 'rgb(59, 130, 246)'
                          }}>
                            {config.isLiveMode ? 'Live' : 'Test'}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '20px',
                          fontSize: '13px',
                          color: 'var(--text-muted)'
                        }}>
                          {new Date(config.createdAt).toLocaleDateString()}
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
                              onClick={() => onValidate(config)}
                              disabled={validating === config.id}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-light)',
                                background: 'transparent',
                                color: 'var(--text-primary)',
                                cursor: validating === config.id ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '13px',
                                fontWeight: 500,
                                transition: 'all 0.2s ease',
                                opacity: validating === config.id ? 0.6 : 1
                              }}
                              title="Validate Credentials"
                            >
                              <CheckCircle2 size={14} />
                              {validating === config.id ? 'Validating...' : 'Validate'}
                            </button>
                            <button
                              onClick={() => startEdit(config)}
                              disabled={saving || editingConfig?.id === config.id}
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
                            >
                              <Edit size={14} />
                              Edit
                            </button>
                            {config.isActive ? (
                              <button
                                onClick={() => onDeactivate(config)}
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
                              >
                                <PowerOff size={14} />
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => onReactivate(config)}
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
                              >
                                <Power size={14} />
                                Reactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && filteredConfigs.length > 0 && (
            <div style={{ 
              marginTop: '16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '14px'
            }}>
              Showing {filteredConfigs.length} of {configs.length} configuration{configs.length !== 1 ? 's' : ''}
            </div>
          )}
        </>
      )}

      {/* Supported Gateways Info */}
      {gatewayInfos.length > 0 && (
        <div style={{ 
          marginTop: '32px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Settings size={20} color="var(--primary)" />
            Supported Payment Gateways
          </h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {gatewayInfos.map((info) => (
              <div key={info.type} style={{
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                background: info.isImplemented ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)'
              }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ 
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}>
                    {info.displayName}
                  </span>
                  {info.isImplemented ? (
                    <CheckCircle2 size={16} color="rgb(34, 197, 94)" />
                  ) : (
                    <XCircle size={16} color="rgb(239, 68, 68)" />
                  )}
                </div>
                <div style={{ 
                  fontSize: '12px',
                  color: 'var(--text-muted)'
                }}>
                  Currency: {info.defaultCurrency}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
