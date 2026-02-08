"use client";

import { useEffect, useState } from "react";
import { 
  Search, Filter, MapPin, Globe, Phone, Mail, 
  TrendingUp, Activity, CheckCircle2, Clock, 
  AlertCircle, Plus, MoreHorizontal, ExternalLink,
  Target, Users, Send, MessageSquare, Calendar,
  ShieldCheck, RefreshCw, ChevronRight, Briefcase
} from "lucide-react";
import { 
  listLeads, Lead, LeadStatus, updateLeadStatus, 
  addLeadActivity, triggerLeadDiscovery 
} from "@/lib/api/leads";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ status?: LeadStatus; city?: string }>({});
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [discoveryCity, setDiscoveryCity] = useState("Pune");
  const [discoveryCategory, setDiscoveryCategory] = useState("Restaurant");
  const [discoveryLoading, setDiscoveryLoading] = useState(false);

  useEffect(() => {
    loadLeads();
  }, [filter]);

  async function loadLeads() {
    setLoading(true);
    try {
      const data = await listLeads(filter);
      setLeads(data);
    } catch (e) {
      console.error("Failed to load leads", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDiscovery() {
    setDiscoveryLoading(true);
    try {
      await triggerLeadDiscovery(discoveryCity, "VimanNagar", discoveryCategory);
      alert("Discovery job triggered. Results will appear in few minutes.");
      loadLeads();
    } catch (e) {
      console.error("Discovery failed", e);
    } finally {
      setDiscoveryLoading(false);
    }
  }

  const stats = [
    { label: "Total Leads", value: leads.length, color: "var(--info)" },
    { label: "High Score (>50)", value: leads.filter(l => l.score > 50).length, color: "var(--primary)" },
    { label: "Qualified", value: leads.filter(l => l.status === "QUALIFIED").length, color: "var(--success)" },
    { label: "Converted", value: leads.filter(l => l.status === "CONVERTED").length, color: "var(--warning)" },
  ];

  return (
    <div style={{ padding: 32, background: "var(--bg-primary)", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Lead Discovery & Sales</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>Manage and track restaurant leads</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
            <div style={{ display: "flex", gap: 8, background: "var(--bg-surface)", padding: 8, borderRadius: 12, border: "1px solid var(--border-light)" }}>
                <input 
                    value={discoveryCity} 
                    onChange={e => setDiscoveryCity(e.target.value)}
                    placeholder="City" 
                    style={{ border: "none", background: "transparent", outline: "none", width: 100, fontSize: 13 }}
                />
                <input 
                    value={discoveryCategory} 
                    onChange={e => setDiscoveryCategory(e.target.value)}
                    placeholder="Category" 
                    style={{ border: "none", background: "transparent", outline: "none", width: 100, fontSize: 13 }}
                />
                <button 
                    onClick={handleDiscovery}
                    disabled={discoveryLoading}
                    style={{ 
                        background: "var(--primary)", 
                        color: "white", 
                        border: "none", 
                        padding: "6px 16px", 
                        borderRadius: 8, 
                        fontSize: 13, 
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                    }}
                >
                    {discoveryLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                    Discover
                </button>
                <button 
                    onClick={async () => {
                        try {
                            await (await import("@/lib/api/leads")).triggerLeadEnrichment();
                            alert("Enrichment started. Email/Contacts will be extracted shortly.");
                        } catch (e) {
                            alert("Enrichment failed to start");
                        }
                    }}
                    style={{ 
                        background: "var(--success)", 
                        color: "white", 
                        border: "none", 
                        padding: "6px 16px", 
                        borderRadius: 8, 
                        fontSize: 13, 
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                    }}
                >
                    <Mail size={14} />
                    Enrich
                </button>
            </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: "var(--bg-surface)", padding: 24, borderRadius: 16, border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{s.label}</p>
            <p style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        {/* Lead List */}
        <div style={{ background: "var(--bg-surface)", borderRadius: 16, border: "1px solid var(--border-light)", overflow: "hidden" }}>
           <div style={{ padding: 20, borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Leads Board</h3>
              <div style={{ display: "flex", gap: 8 }}>
                 <select 
                    style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border-light)", fontSize: 13 }}
                    onChange={e => setFilter({ ...filter, status: e.target.value as LeadStatus || undefined })}
                 >
                    <option value="">All Status</option>
                    <option value="DISCOVERED">Discovered</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="CONVERTED">Converted</option>
                 </select>
              </div>
           </div>
           
           <div style={{ maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>Loading leads...</div>
              ) : leads.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>No leads found. Use Discovery tool to find leads.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "var(--bg-tertiary)", position: "sticky", top: 0 }}>
                    <tr>
                      <th style={{ textAlign: "left", padding: "12px 20px", fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>BUSINESS</th>
                      <th style={{ textAlign: "left", padding: "12px 20px", fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>STATUS</th>
                      <th style={{ textAlign: "left", padding: "12px 20px", fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>SCORE</th>
                      <th style={{ textAlign: "right", padding: "12px 20px", fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => (
                      <tr key={lead.id} onClick={() => setSelectedLead(lead)} style={{ borderBottom: "1px solid var(--border-light)", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-tertiary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{lead.name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                            <MapPin size={12} /> {lead.area || lead.city}
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                           <span style={{ 
                             fontSize: 11, fontWeight: 600, padding: "4px 8px", borderRadius: 6,
                             background: 
                               lead.status === "CONVERTED" ? "rgba(16, 185, 129, 0.1)" :
                               lead.status === "QUALIFIED" ? "rgba(59, 130, 246, 0.1)" : 
                               "rgba(107, 114, 128, 0.1)",
                             color:
                               lead.status === "CONVERTED" ? "var(--success)" :
                               lead.status === "QUALIFIED" ? "var(--info)" : 
                               "var(--text-secondary)"
                           }}>
                             {lead.status}
                           </span>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 40, height: 4, background: "#eee", borderRadius: 2, overflow: "hidden" }}>
                                <div style={{ width: `${Math.min(lead.score, 100)}%`, height: "100%", background: lead.score > 70 ? "var(--success)" : lead.score > 40 ? "var(--warning)" : "var(--error)" }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{lead.score.toFixed(0)}</span>
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px", textAlign: "right" }}>
                           <ChevronRight size={16} color="var(--text-tertiary)" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
           </div>
        </div>

        {/* Lead Detail Panel */}
        <div style={{ background: "var(--bg-surface)", borderRadius: 16, border: "1px solid var(--border-light)", padding: 24 }}>
           {selectedLead ? (
             <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                     <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selectedLead.name}</h2>
                     <button onClick={() => setSelectedLead(null)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>&times;</button>
                </div>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
                    {selectedLead.website && (
                         <a href={selectedLead.website} target="_blank" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--primary)", fontWeight: 500, textDecoration: "none" }}>
                            <Globe size={14} /> Website <ExternalLink size={12} />
                         </a>
                    )}
                    {selectedLead.phone && (
                         <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}>
                            <Phone size={14} /> {selectedLead.phone}
                         </div>
                    )}
                </div>

                <div style={{ padding: 16, background: "var(--bg-tertiary)", borderRadius: 12, marginBottom: 24 }}>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>Current Address</div>
                    <div style={{ fontSize: 14 }}>{selectedLead.address}</div>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                        <Briefcase size={16} color="var(--primary)" /> Contacts
                    </h4>
                    {selectedLead.contacts && selectedLead.contacts.length > 0 ? (
                        selectedLead.contacts.map((c, i) => (
                            <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{c.email || c.phone}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{c.role || "Contact"}</div>
                                </div>
                                {c.isSpoc && <span style={{ fontSize: 10, background: "rgba(239, 68, 68, 0.1)", color: "var(--error)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>SPOC</span>}
                            </div>
                        ))
                    ) : (
                        <div style={{ fontSize: 13, color: "var(--text-tertiary)", fontStyle: "italic" }}>No enriched contact info yet.</div>
                    )}
                </div>

                <div style={{ marginBottom: 24 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Quick outreach</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <button style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border-light)", background: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                            <Phone size={14} /> Call
                        </button>
                        <button style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border-light)", background: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                            <Mail size={14} /> Email
                        </button>
                    </div>
                </div>

                <div>
                     <button style={{ width: "100%", padding: 12, background: "var(--warning)", color: "white", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                         <Target size={18} /> Send Pitch Deck
                     </button>
                     <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>This will generate a unique tracking link</p>
                </div>
             </div>
           ) : (
             <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", textAlign: "center", padding: 40 }}>
                <Target size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                <p>Select a lead to view details and start outreach</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
