"use client";

import { useEffect, useState } from "react";
import { 
  Search, MapPin, Globe, Phone, Mail, 
  ExternalLink, Target, RefreshCw, ChevronRight, 
  Briefcase, Activity, CheckCircle2, Award, Users,
  X, Send, Layout
} from "lucide-react";
import { 
  listLeads, Lead, LeadStatus, updateLeadStatus, 
  addLeadActivity, triggerLeadDiscovery, getLead,
  generateLeadPitch, triggerLeadEnrichment, triggerLeadNormalization
} from "@/lib/api/leads";
import styles from "./LeadsPage.module.css";
import { isTenantAdminToken } from "@/lib/utils/admin";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ status?: LeadStatus; city?: string; area?: string; address?: string; name?: string }>({});
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Discovery form states
  const [discoveryCity, setDiscoveryCity] = useState("Pune");
  const [discoveryArea, setDiscoveryArea] = useState("Viman Nagar");
  const [discoveryCategory, setDiscoveryCategory] = useState("Restaurant");
  const [discoveryLoading, setDiscoveryLoading] = useState(false);

  // Activity form states
  const [activityChannel, setActivityChannel] = useState("CALL");
  const [activityOutcome, setActivityOutcome] = useState("");
  const [activityLoading, setActivityLoading] = useState(false);
  
  // Pitch deck states
  const [pitchLink, setPitchLink] = useState("");
  const [pitchLoading, setPitchLoading] = useState(false);

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

  async function fetchLeadDetails(id: number) {
    setDetailsLoading(true);
    try {
        const fullLead = await getLead(id);
        setSelectedLead(fullLead);
        setPitchLink(""); // Reset pitch link when changing lead
    } catch (e) {
        console.error("Failed to load lead details", e);
    } finally {
        setDetailsLoading(false);
    }
  }

  async function handleStatusChange(newStatus: LeadStatus) {
    if (!selectedLead) return;
    try {
        await updateLeadStatus(selectedLead.id, newStatus);
        await fetchLeadDetails(selectedLead.id);
        loadLeads(); // Refresh list
    } catch (e) {
        alert("Failed to update stage");
    }
  }

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead || !activityOutcome) return;
    
    setActivityLoading(true);
    try {
        await addLeadActivity(selectedLead.id, {
            channel: activityChannel,
            outcome: activityOutcome,
            performedBy: "TENANT_ADMIN" // Hardcoded for now
        });
        setActivityOutcome("");
        await fetchLeadDetails(selectedLead.id);
    } catch (e) {
        alert("Failed to record activity");
    } finally {
        setActivityLoading(true);
        setActivityLoading(false);
    }
  }

  async function handleGeneratePitch() {
    if (!selectedLead) return;
    setPitchLoading(true);
    try {
        const link = await generateLeadPitch(selectedLead.id);
        setPitchLink(link);
        await fetchLeadDetails(selectedLead.id); // Activity is recorded on backend
    } catch (e) {
        alert("Failed to generate pitch link");
    } finally {
        setPitchLoading(false);
    }
  }

  async function handleDiscovery() {
    if (!discoveryCity || !discoveryArea) {
        alert("Please provide both City and Area");
        return;
    }
    setDiscoveryLoading(true);
    try {
      const performed = await triggerLeadDiscovery(discoveryCity, discoveryArea, discoveryCategory);
      if (performed) {
        alert("Discovery job triggered. Results will appear in few minutes.");
      } else {
        alert("Data for this City/Area already exists. Board has been refreshed with existing data.");
      }
      loadLeads();
    } catch (e) {
      console.error("Discovery failed", e);
      alert("Discovery failed. Please check logs.");
    } finally {
      setDiscoveryLoading(false);
    }
  }

  const stats = [
    { label: "Total Leads", value: leads.length, icon: Users, color: "var(--primary)" },
    { label: "Hot Prospects", value: leads.filter((l: Lead) => l.score > 70).length, icon: Activity, color: "var(--error)" },
    { label: "Qualified", value: leads.filter((l: Lead) => l.status === "QUALIFIED").length, icon: Award, color: "var(--info)" },
    { label: "Conversions", value: leads.filter((l: Lead) => l.status === "CONVERTED").length, icon: CheckCircle2, color: "var(--success)" },
  ];

  const getStatusStyle = (status: LeadStatus) => {
    switch (status) {
      case "CONVERTED": return { background: "rgba(16, 185, 129, 0.1)", color: "var(--success)" };
      case "QUALIFIED": return { background: "rgba(59, 130, 246, 0.1)", color: "var(--info)" };
      case "CONTACTED": return { background: "rgba(245, 158, 11, 0.1)", color: "var(--warning)" };
      case "PITCHED": return { background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)" };
      case "LOST": return { background: "rgba(239, 68, 68, 0.1)", color: "var(--error)" };
      default: return { background: "rgba(107, 114, 128, 0.1)", color: "var(--text-secondary)" };
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Lead Intelligence</h1>
          <p>Find and convert high-potential restaurants with AI-powered discovery</p>
        </div>
        
        <div className={styles.discoveryBar}>
          <div style={{ display: "flex", gap: 8 }}>
            <div className={styles.discoveryGroup}>
              <MapPin size={14} color="var(--text-tertiary)" />
              <input 
                className={styles.discoveryInput}
                value={discoveryCity} 
                onChange={e => setDiscoveryCity(e.target.value)}
                placeholder="City (e.g. Pune)" 
              />
            </div>
            <div className={styles.discoveryGroup}>
              <Layout size={14} color="var(--text-tertiary)" />
              <input 
                className={styles.discoveryInput}
                value={discoveryArea} 
                onChange={e => setDiscoveryArea(e.target.value)}
                placeholder="Area (e.g. Baner)" 
              />
            </div>
            <div className={styles.discoveryGroup}>
              <Briefcase size={14} color="var(--text-tertiary)" />
              <input 
                className={styles.discoveryInput}
                value={discoveryCategory} 
                onChange={e => setDiscoveryCategory(e.target.value)}
                placeholder="Category" 
              />
            </div>
          </div>
          <button 
            className={styles.discoverBtn}
            onClick={handleDiscovery}
            disabled={discoveryLoading}
          >
            {discoveryLoading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
            Discover
          </button>
          <button 
            className={styles.normalizeBtn}
            onClick={async () => {
              try {
                await triggerLeadNormalization();
                alert("Data normalization complete. Fresh leads are now visible.");
                loadLeads();
              } catch (e) {
                alert("Normalization failed");
              }
            }}
          >
            <RefreshCw size={16} />
            Normalize
          </button>
          <button 
            className={styles.enrichBtn}
            onClick={async () => {
              try {
                await triggerLeadEnrichment();
                alert("Deep enrichment started. Business contacts will be extracted.");
              } catch (e) {
                alert("Enrichment failed to start");
              }
            }}
          >
            <RefreshCw size={16} />
            Enrich
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {stats.map((s, i) => (
          <div key={i} className={styles.statCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p className={styles.statLabel}>{s.label}</p>
                <p className={styles.statValue}>{s.value}</p>
              </div>
              <div style={{ background: s.color + "20", color: s.color, padding: 10, borderRadius: 12 }}>
                <s.icon size={20} />
              </div>
            </div>
            <div style={{ position: "absolute", right: -10, bottom: -10, opacity: 0.03 }}>
                <s.icon size={80} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className={styles.mainGrid}>
        {/* Lead List */}
        <div className={styles.boardCard}>
           <div className={styles.boardHeader}>
              <h3 className={styles.boardTitle}>Opportunity Board</h3>
              <div className={styles.filterBar}>
                 <div className={styles.filterGroup}>
                   <Search size={14} color="var(--text-tertiary)" />
                   <input 
                      placeholder="Business Name..."
                      value={filter.name || ""}
                      onChange={e => setFilter({ ...filter, name: e.target.value || undefined })}
                   />
                 </div>
                 <div className={styles.filterGroup}>
                   <MapPin size={14} color="var(--text-tertiary)" />
                   <input 
                      placeholder="City..."
                      value={filter.city || ""}
                      onChange={e => setFilter({ ...filter, city: e.target.value || undefined })}
                   />
                 </div>
                 <div className={styles.filterGroup}>
                   <Layout size={14} color="var(--text-tertiary)" />
                   <input 
                      placeholder="Area..."
                      value={filter.area || ""}
                      onChange={e => setFilter({ ...filter, area: e.target.value || undefined })}
                   />
                 </div>
                 <div className={styles.filterGroup}>
                   <Globe size={14} color="var(--text-tertiary)" />
                   <input 
                      placeholder="Address..."
                      value={filter.address || ""}
                      onChange={e => setFilter({ ...filter, address: e.target.value || undefined })}
                   />
                 </div>
                 <select 
                    className={styles.filterSelect}
                    onChange={e => setFilter({ ...filter, status: e.target.value as LeadStatus || undefined })}
                 >
                    <option value="">All Stages</option>
                    <option value="DISCOVERED">Discovered</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="PITCHED">Pitched</option>
                    <option value="CONVERTED">Converted</option>
                    <option value="LOST">Lost</option>
                 </select>
                 <button onClick={loadLeads} className={styles.closeBtn} title="Refresh board">
                    <RefreshCw size={16} />
                 </button>
              </div>
           </div>
           
           <div style={{ maxHeight: "calc(100vh - 420px)", overflowY: "auto" }}>
              {loading ? (
                <div className={styles.loadingOverlay}>
                    <RefreshCw size={32} className="animate-spin" style={{ margin: "0 auto 16px", color: "var(--primary)" }} />
                    <p>Fetching opportunities...</p>
                </div>
              ) : leads.length === 0 ? (
                <div className={styles.emptyState}>
                    <Target size={64} style={{ opacity: 0.1, marginBottom: 20 }} />
                    <p>No leads found for these filters.</p>
                    <p style={{ fontSize: 13, marginTop: 8 }}>Try adjusting your search criteria or use the Discovery tool.</p>
                </div>
              ) : (
                <table className={styles.leadsTable}>
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Stage</th>
                      <th>Lead Score</th>
                      <th style={{ textAlign: "right" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => (
                      <tr 
                        key={lead.id} 
                        className={styles.leadRow}
                        onClick={() => fetchLeadDetails(lead.id)} 
                        style={{ background: selectedLead?.id === lead.id ? "var(--bg-tertiary)" : "transparent" }}
                      >
                        <td>
                          <div className={styles.businessName}>{lead.name}</div>
                          <div className={styles.locationInfo}>
                            <MapPin size={12} /> {lead.address}
                          </div>
                        </td>
                        <td>
                           <span className={styles.statusBadge} style={getStatusStyle(lead.status)}>
                             {lead.status}
                           </span>
                        </td>
                        <td>
                          <div className={styles.scoreContainer}>
                            <div className={styles.scoreTrack}>
                                <div 
                                    className={styles.scoreFill} 
                                    style={{ 
                                        width: `${Math.min(lead.score, 100)}%`, 
                                        background: lead.score > 70 ? "var(--success)" : lead.score > 40 ? "var(--warning)" : "var(--error)" 
                                    }} 
                                />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700 }}>{lead.score.toFixed(0)}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: "right", paddingRight: 24 }}>
                           <ChevronRight size={18} color="var(--text-tertiary)" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
           </div>
        </div>

        {/* Lead Detail Panel */}
        <div className={styles.detailPanel}>
           {detailsLoading ? (
             <div className={styles.loadingOverlay} style={{ height: "100%" }}>
                <RefreshCw size={32} className="animate-spin" style={{ margin: "0 auto 16px", color: "var(--primary)" }} />
                <p>Loading full profile...</p>
             </div>
           ) : selectedLead ? (
             <div>
                <div className={styles.detailHeader}>
                     <div>
                        <h2>{selectedLead.name}</h2>
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <span className={styles.statusBadge} style={getStatusStyle(selectedLead.status)}>
                                {selectedLead.status}
                            </span>
                            <span style={{ fontSize: 13, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}>
                                <Award size={14} /> Score {selectedLead.score.toFixed(0)}
                            </span>
                        </div>
                     </div>
                     <button onClick={() => setSelectedLead(null)} className={styles.closeBtn}>
                        <X size={20} />
                     </button>
                </div>

                <div className={styles.infoSection} style={{ background: "var(--bg-primary)" }}>
                     <div className={styles.sectionLabel}>Sales Pipeline Stage</div>
                     <select 
                        className={styles.stageSelect} 
                        value={selectedLead.status}
                        onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                     >
                         <option value="DISCOVERED">Discovered</option>
                         <option value="QUALIFIED">Qualified</option>
                         <option value="CONTACTED">Contacted</option>
                         <option value="PITCHED">Pitched</option>
                         <option value="DEMO_SCHEDULED">Demo Scheduled</option>
                         <option value="FOLLOW_UP">Follow Up</option>
                         <option value="CONVERTED">Converted</option>
                         <option value="LOST">Lost</option>
                     </select>
                </div>
                
                <div className={styles.contactLinks}>
                    {selectedLead.website && (
                         <a href={selectedLead.website} target="_blank" className={styles.contactLink}>
                            <Globe size={16} /> Website <ExternalLink size={12} />
                         </a>
                    )}
                    {selectedLead.phone && (
                         <div className={styles.contactLink} style={{ color: "var(--text-primary)", background: "var(--bg-tertiary)" }}>
                            <Phone size={16} /> {selectedLead.phone}
                         </div>
                    )}
                </div>

                <div className={styles.infoSection}>
                    <div className={styles.sectionLabel}>Location & Address</div>
                    <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-primary)" }}>
                        {selectedLead.address}
                        <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLead.address)}`} 
                            target="_blank" 
                            style={{ display: "block", marginTop: 8, color: "var(--primary)", fontSize: 11, fontWeight: 700, textDecoration: "none" }}
                        >
                            VIEW ON GOOGLE MAPS <ExternalLink size={10} />
                        </a>
                    </div>
                </div>

                <div className={styles.infoSection}>
                    <div className={styles.sectionLabel}>Business Contact Matrix</div>
                    {selectedLead.contacts && selectedLead.contacts.length > 0 ? (
                        selectedLead.contacts.map((c, i) => (
                            <div key={i} className={styles.contactItem} style={{ borderBottom: "1px solid var(--border-light)" }}>
                                <div>
                                    <div className={styles.contactMain}>{c.email || c.phone}</div>
                                    <div className={styles.contactSub}>{c.role || "Primary Contact"} • {c.source}</div>
                                </div>
                                {c.isSpoc && <span style={{ fontSize: 10, background: "rgba(239, 68, 68, 0.1)", color: "var(--error)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>SPOC</span>}
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: "16px 0", textAlign: "center", color: "var(--text-tertiary)", fontStyle: "italic", fontSize: 13 }}>
                            No deep enrichment data available. Run "Enrich" to crawl website.
                        </div>
                    )}
                </div>

                {/* Outreach Tools */}
                <div style={{ marginBottom: 32 }}>
                    <div className={styles.sectionLabel}>Next Outreach Action</div>
                    <div className={styles.actionGrid}>
                        <button className={styles.actionBtn}>
                            <Phone size={16} /> Call
                        </button>
                        <button className={styles.actionBtn}>
                            <Mail size={16} /> Email
                        </button>
                    </div>
                    
                    <button className={styles.pitchBtn} onClick={handleGeneratePitch} disabled={pitchLoading}>
                         {pitchLoading ? <RefreshCw size={20} className="animate-spin" /> : <Target size={20} />}
                         {pitchLink ? "Regenerate Pitch Deck" : "Generate & Send Pitch"}
                    </button>
                    
                    {pitchLink && (
                        <div className={styles.pitchDisplay}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--warning)", display: "flex", alignItems: "center", gap: 6 }}>
                                <ExternalLink size={14} /> Tracking Link Ready
                            </div>
                            <input 
                                className={styles.pitchInput} 
                                value={pitchLink} 
                                readOnly 
                                onClick={(e) => e.currentTarget.select()} 
                            />
                        </div>
                    )}
                </div>

                {/* Activity Feed */}
                <div style={{ marginBottom: 32 }}>
                    <div className={styles.sectionLabel}>Engagement Feed & Logs</div>
                    
                    <form className={styles.activityForm} onSubmit={handleAddActivity}>
                        <div className={styles.formGrid}>
                            <select 
                                className={styles.filterSelect}
                                value={activityChannel}
                                onChange={e => setActivityChannel(e.target.value)}
                            >
                                <option value="CALL">Call</option>
                                <option value="EMAIL">Email</option>
                                <option value="MEETING">Meeting</option>
                                <option value="WHATSAPP">WhatsApp</option>
                                <option value="VISIT">Physical Visit</option>
                            </select>
                            <button 
                                type="submit" 
                                className={styles.discoverBtn} 
                                style={{ padding: 8 }}
                                disabled={activityLoading || !activityOutcome}
                            >
                                {activityLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />} Log
                            </button>
                        </div>
                        <textarea 
                            className={styles.pitchInput} 
                            placeholder="Outcome of the interaction..." 
                            style={{ height: 60, resize: "none" }}
                            value={activityOutcome}
                            onChange={e => setActivityOutcome(e.target.value)}
                        />
                    </form>

                    <div style={{ borderTop: "1px solid var(--border-light)" }}>
                        {selectedLead.activities && selectedLead.activities.length > 0 ? (
                            selectedLead.activities.map((act, i) => (
                                <div key={i} className={styles.activityItem}>
                                    <div className={styles.activityIcon}>
                                        <Activity size={16} />
                                    </div>
                                    <div className={styles.activityContent}>
                                        <div className={styles.activityHeader}>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>{act.channel}</span>
                                            <span className={styles.activityTime}>{new Date(act.performedAt).toLocaleString()}</span>
                                        </div>
                                        <div className={styles.activityOutcome}>{act.outcome}</div>
                                        <div className={styles.activityMeta}>
                                            <span>by {act.performedBy}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: 20, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
                                No activities recorded yet.
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.infoSection} style={{ background: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.1)" }}>
                    <div className={styles.sectionLabel} style={{ color: "var(--primary)" }}>AI Lead Intelligence</div>
                    <p style={{ fontSize: 13, margin: "8px 0 0", color: "var(--text-secondary)" }}>
                        Sentiment: Positive. Conversion Probability: 72%. 
                        Recommendation: Follow up via Visit to demo POS hardware.
                    </p>
                </div>
             </div>
           ) : (
             <div className={styles.emptyState}>
                <div style={{ background: "var(--bg-tertiary)", padding: 24, borderRadius: "50%", marginBottom: 24 }}>
                    <Target size={48} style={{ color: "var(--primary)", opacity: 0.5 }} />
                </div>
                <h3 style={{ margin: "0 0 8px", color: "var(--text-primary)" }}>Intelligence Hub</h3>
                <p style={{ fontSize: 14 }}>Select a lead to unlock predictive scoring, engagement history, and outreach automation.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
