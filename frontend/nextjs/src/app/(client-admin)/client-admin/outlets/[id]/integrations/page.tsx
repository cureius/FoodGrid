"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Settings, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Zap,
  Globe,
  Database,
  ArrowRightLeft,
  Loader2,
  Trash2,
  Power
} from "lucide-react";
import Link from "next/link";
import { 
  listIntegrations, 
  saveIntegration, 
  testIntegration, 
  syncMenu,
  type ChannelIntegration 
} from "@/lib/api/clientAdmin";
import { useOutlet } from "@/contexts/OutletContext";

export default function IntegrationsPage() {
  const { id } = useParams();
  const outletId = id as string;
  const router = useRouter();
  const { selectedOutletId, outlets } = useOutlet();
  
  const [integrations, setIntegrations] = useState<ChannelIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editChannel, setEditChannel] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    externalStoreId: "",
    authPayload: "",
    isActive: true
  });

  const currentOutlet = outlets.find(o => o.id === outletId);

  useEffect(() => {
    if (outletId) {
      fetchIntegrations();
    }
  }, [outletId]);

  async function fetchIntegrations() {
    try {
      setLoading(true);
      const data = await listIntegrations(outletId);
      setIntegrations(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (int?: ChannelIntegration, channel?: string) => {
    if (int) {
      setEditChannel(int.channel);
      setFormData({
        externalStoreId: int.externalStoreId,
        authPayload: int.authPayload,
        isActive: int.isActive
      });
    } else if (channel) {
      setEditChannel(channel);
      setFormData({
        externalStoreId: "",
        authPayload: "",
        isActive: true
      });
    }
  };

  const handleSave = async () => {
    if (!editChannel) return;
    try {
      setActionLoading("save");
      await saveIntegration(outletId, editChannel, formData as any);
      setEditChannel(null);
      await fetchIntegrations();
    } catch (err: any) {
      alert(err?.message || "Failed to save integration");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTest = async (channel: string) => {
    try {
      setActionLoading(`test-${channel}`);
      await testIntegration(outletId, channel);
      alert(`${channel} connection successful!`);
    } catch (err: any) {
      alert(`Connection failed: ${err?.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSync = async (channel: string, direction: "PUSH" | "PULL") => {
    try {
      setActionLoading(`sync-${channel}-${direction}`);
      await syncMenu(outletId, channel, direction);
      alert(`Menu sync ${direction.toLowerCase()} initiated successfully!`);
      await fetchIntegrations();
    } catch (err: any) {
      alert(`Sync failed: ${err?.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const channels = [
    { 
      id: "SWIGGY", 
      name: "Swiggy", 
      color: "#f14f0e", 
      logo: "https://play-lh.googleusercontent.com/ymXDmYihTOzgPDddKSvZRKzXkboAapBF2yoFIeQBaWSAJmC9IUpSPKgvfaAgS5yFxQ=w240-h480-rw" 
    },
    { 
      id: "ZOMATO", 
      name: "Zomato", 
      color: "#eb2231", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Zomato_logo.png/320px-Zomato_logo.png" 
    }
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Loader2 size={48} className="animate-spin" style={{ color: "#8b5cf6" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <button 
          onClick={() => router.back()}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 8, 
            background: "none", 
            border: "none", 
            color: "#64748b", 
            fontSize: 14, 
            fontWeight: 600, 
            cursor: "pointer",
            marginBottom: 20
          }}
        >
          <ChevronLeft size={16} /> Back to Outlets
        </button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1e293b", margin: 0 }}>Integrations</h1>
            <p style={{ color: "#64748b", margin: "8px 0 0" }}>Manage external channels for {currentOutlet?.name || "Outlet"}</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button 
              onClick={fetchIntegrations}
              className="group"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                borderRadius: 12,
                background: "white",
                border: "1px solid #e2e8f0",
                color: "#64748b",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <RefreshCw size={18} className={actionLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: 24 }}>
        {channels.map(channel => {
          const config = integrations.find(i => i.channel === channel.id);
          const isEnabled = config?.isActive;

          return (
            <div 
              key={channel.id}
              style={{
                background: "white",
                borderRadius: 24,
                border: "1px solid #e2e8f0",
                padding: 32,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                transition: "all 0.3s ease",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div style={{ 
                position: "absolute", 
                top: 0, 
                left: 0, 
                width: "100%", 
                height: 6, 
                background: channel.color 
              }} />

              {/* Channel Info */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #e2e8f0",
                    padding: 12
                  }}>
                    <img src={channel.logo} alt={channel.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0 }}>{channel.name}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: isEnabled ? "#10b981" : "#94a3b8"
                      }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: isEnabled ? "#10b981" : "#64748b" }}>
                        {isEnabled ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleEdit(config, channel.id)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 12,
                    background: isEnabled ? "rgba(139, 92, 246, 0.1)" : "#f1f5f9",
                    color: isEnabled ? "#8b5cf6" : "#64748b",
                    fontSize: 14,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  {config ? "Configure" : "Connect"}
                </button>
              </div>

              {/* Status & Sync Details */}
              {config ? (
                <div style={{ 
                  background: "#f8fafc", 
                  borderRadius: 16, 
                  padding: 24, 
                  marginBottom: 32,
                  border: "1px solid #e2e8f0"
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Store ID</span>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: "4px 0 0" }}>{config.externalStoreId}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Last Sync</span>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: "4px 0 0" }}>
                        {config.lastSyncAt ? new Date(config.lastSyncAt).toLocaleString() : "Never"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  background: "#fdf2f2", 
                  borderRadius: 16, 
                  padding: 24, 
                  marginBottom: 32,
                  border: "1px solid #fee2e2",
                  textAlign: "center"
                }}>
                  <AlertCircle size={32} style={{ color: "#ef4444", margin: "0 auto 12px" }} />
                  <p style={{ color: "#b91c1c", fontSize: 14, fontWeight: 600, margin: 0 }}>
                    Not configured for this outlet
                  </p>
                </div>
              )}

              {/* Actions */}
              <div style={{ marginTop: "auto", display: "flex", gap: 12 }}>
                <button 
                  disabled={!isEnabled || !!actionLoading}
                  onClick={() => handleTest(channel.id)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "14px",
                    borderRadius: 12,
                    background: "white",
                    border: "1px solid #e2e8f0",
                    color: isEnabled ? "#1e293b" : "#94a3b8",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: isEnabled ? "pointer" : "not-allowed",
                  }}
                >
                  <Globe size={18} /> Test Connection
                </button>
                <button 
                  disabled={!isEnabled || !!actionLoading}
                  onClick={() => handleSync(channel.id, "PUSH")}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "14px",
                    borderRadius: 12,
                    background: isEnabled ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" : "#e2e8f0",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 700,
                    border: "none",
                    cursor: isEnabled ? "pointer" : "not-allowed",
                    boxShadow: isEnabled ? "0 4px 12px rgba(139, 92, 246, 0.25)" : "none"
                  }}
                >
                  <RefreshCw size={18} className={actionLoading === `sync-${channel.id}-PUSH` ? "animate-spin" : ""} /> Push Menu
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editChannel && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: "white",
            width: "100%",
            maxWidth: 500,
            borderRadius: 32,
            padding: 40,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", margin: "0 0 8px" }}>
              Configure {editChannel}
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, marginBottom: 32 }}>
              Enter your provider credentials to enable order syncing.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                  External Store ID
                </label>
                <input 
                  value={formData.externalStoreId}
                  onChange={e => setFormData({ ...formData, externalStoreId: e.target.value })}
                  placeholder="e.g. SW-12345"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 15,
                    outline: "none",
                    background: "#f8fafc"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                  Auth Payload (JSON)
                </label>
                <textarea 
                  value={formData.authPayload}
                  onChange={e => setFormData({ ...formData, authPayload: e.target.value })}
                  placeholder='{"api_key": "...", "token": "..."}'
                  style={{
                    width: "100%",
                    height: 120,
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 14,
                    fontFamily: "monospace",
                    outline: "none",
                    background: "#f8fafc",
                    resize: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>Active Status</h4>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>Enable or disable this channel</p>
                </div>
                <button 
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  style={{
                    width: 52,
                    height: 28,
                    borderRadius: 14,
                    background: formData.isActive ? "#10b981" : "#e2e8f0",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.3s ease"
                  }}
                >
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "white",
                    position: "absolute",
                    top: 3,
                    left: formData.isActive ? 27 : 3,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                  }} />
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
              <button 
                onClick={() => setEditChannel(null)}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: 12,
                  background: "white",
                  border: "1px solid #e2e8f0",
                  color: "#64748b",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button 
                disabled={!!actionLoading}
                onClick={handleSave}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
              >
                {actionLoading === "save" ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Save Integration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
