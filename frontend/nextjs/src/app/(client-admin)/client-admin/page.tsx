"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./dashboard/Dashboard.module.css";
import { listEmployees, listOutlets } from "@/lib/api/clientAdmin";

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(d: Date) {
  return d.toLocaleDateString([], { weekday: "long", year: "numeric", month: "short", day: "numeric" });
}

function Icon({ name }: { name: "store" | "users" | "check" | "ban" }) {
  const common = {
    width: 44,
    height: 44,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  } as const;

  const stroke = "currentColor";
  const s = { stroke, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (name) {
    case "store":
      return (
        <svg {...common}>
          <path {...s} d="M3 10.5V21h18V10.5" />
          <path {...s} d="M3 10.5l2-7.5h14l2 7.5" />
          <path {...s} d="M7 21v-7h10v7" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <path {...s} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <path {...s} d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          <path {...s} d="M22 21v-2a3.5 3.5 0 0 0-2.5-3.36" />
          <path {...s} d="M16.5 3.14a4 4 0 0 1 0 7.72" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path {...s} d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "ban":
      return (
        <svg {...common}>
          <path {...s} d="M18.36 18.36A9 9 0 1 1 5.64 5.64" />
          <path {...s} d="M5.64 18.36 18.36 5.64" />
        </svg>
      );
  }
}

export default function Page() {
  useEffect(() => {
    const t = localStorage.getItem("fg_client_admin_access_token");
    if (!t) window.location.href = "/client-admin/login";
  }, []);

  const outletId = process.env.NEXT_PUBLIC_OUTLET_ID ?? "";

  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [outlets, setOutlets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const [oRes, eRes] = await Promise.all([
        listOutlets(),
        outletId ? listEmployees(outletId) : Promise.resolve([])
      ]);

      setOutlets(oRes ?? []);
      setEmployees(eRes ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("fg_client_admin_access_token");
    localStorage.removeItem("fg_client_admin_refresh_token");
    window.location.href = "/client-admin/login";
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  const stats = useMemo(() => {
    const activeEmployees = employees.filter((e) => (e.status ?? "ACTIVE") === "ACTIVE").length;
    const inactiveEmployees = employees.length - activeEmployees;

    return {
      outletsCount: outlets.length,
      employeesCount: employees.length,
      activeEmployees,
      inactiveEmployees
    };
  }, [outlets, employees]);

  const muted: React.CSSProperties = { color: "rgba(26, 28, 30, 0.6)" };

  return (
    <div className={styles.container} style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
      <div className={styles.greetingSection}>
        <div>
          <div className={styles.greeting}>Client Admin</div>
          <div className={styles.subGreeting}>
            Manage outlets and employees{outletId ? ` • Outlet: ${outletId}` : ""}
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <div className={styles.time}>{formatTime(now)}</div>
            <div className={styles.date}>{formatDate(now)}</div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Link className={styles.payButton} href="/client-admin/outlets">
              Outlets
            </Link>
            <Link className={styles.payButton} href="/client-admin/employees">
              Employees
            </Link>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className={styles.payButton}
              style={{
                border: 0,
                cursor: loading ? "not-allowed" : "pointer",
                background: loading ? "rgba(57, 111, 255, 0.6)" : undefined
              }}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              type="button"
              onClick={logout}
              className={styles.payButton}
              style={{ border: 0, cursor: "pointer", background: "rgba(26, 28, 30, 0.85)" }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            background: "rgba(220, 38, 38, 0.08)",
            border: "1px solid rgba(220, 38, 38, 0.22)",
            color: "rgb(185, 28, 28)"
          }}
        >
          {error}
        </div>
      ) : null}

      <div className={styles.statsGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div className={styles.statCard}>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Total Outlets</div>
            <div className={styles.statValue}>{loading ? "—" : stats.outletsCount}</div>
            <div className={styles.statChange}>Configured in this account</div>
          </div>
          <div className={styles.statIconWrapper}>
            <Icon name="store" />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Total Employees</div>
            <div className={styles.statValue}>{loading ? "—" : stats.employeesCount}</div>
            <div className={styles.statChange}>{outletId ? "For selected outlet" : "Select an outlet"}</div>
          </div>
          <div className={styles.statIconWrapper}>
            <Icon name="users" />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Active Employees</div>
            <div className={styles.statValue}>{loading ? "—" : stats.activeEmployees}</div>
            <div className={styles.statChange}>Enabled accounts</div>
          </div>
          <div className={styles.statIconWrapper}>
            <Icon name="check" />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Inactive Employees</div>
            <div className={styles.statValue}>{loading ? "—" : stats.inactiveEmployees}</div>
            <div className={styles.statChange}>Disabled accounts</div>
          </div>
          <div className={styles.statIconWrapper}>
            <Icon name="ban" />
          </div>
        </div>
      </div>

      <div className={styles.orderSections} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <div className={styles.orderColumn}>
          <div className={styles.sectionHeader}>
            <h3>Outlets</h3>
            <span className={styles.badge}>{loading ? "…" : outlets.length}</span>
          </div>

          <div className={styles.orderList}>
            {loading ? (
              <div className={styles.orderCard} style={muted}>
                Loading outlets…
              </div>
            ) : outlets.length === 0 ? (
              <div className={styles.orderCard} style={muted}>
                No outlets found.
              </div>
            ) : (
              outlets.slice(0, 6).map((o) => (
                <div key={o.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div className={styles.tableCircle} style={{ background: "var(--primary)" }}>
                      {(o.name ?? "Outlet").slice(0, 2).toUpperCase()}
                    </div>
                    <div className={styles.orderInfo}>
                      <div className={styles.orderId}>{o.name ?? "Unnamed outlet"}</div>
                      <div className={styles.orderTime}>{o.address ?? o.timezone ?? "—"}</div>
                    </div>
                  </div>

                  <div className={styles.orderItems}>
                    <div className={styles.orderItem}>
                      <span>Outlet ID</span>
                      <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                        {o.id}
                      </span>
                    </div>
                  </div>

                  <div className={styles.orderFooter}>
                    <div style={muted}>Open to manage details</div>
                    <Link className={styles.payButton} href="/client-admin/outlets">
                      Manage
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.orderColumn}>
          <div className={styles.sectionHeader}>
            <h3>Employees</h3>
            <span className={styles.badge}>{loading ? "…" : employees.length}</span>
          </div>

          <div className={styles.orderList}></div>
            {loading ? (
              <div className={styles.orderCard} style={muted}>
                Loading employees…
              </div>
            ) : !outletId ? (
              <div className={styles.orderCard} style={muted}>
                Set <code>NEXT_PUBLIC_OUTLET_ID</code> to view employees for a specific outlet.
              </div>
            ) : employees.length === 0 ? (
              <div className={styles.orderCard} style={muted}>
                No employees found.
              </div>
            ) : (
              employees.slice(0, 6).map((e) => (
                <div key={e.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div className={styles.tableCircle} style={{ background: "var(--primary-blue)" }}>
                      {(e.displayName ?? e.email ?? "Emp").slice(0, 2).toUpperCase()}
                    </div>
                    <div className={styles.orderInfo}>
                      <div className={styles.orderId}>{e.displayName ?? "Employee"}</div>
                      <div className={styles.orderTime}>{e.email ?? "—"}</div>
                    </div>
                  </div>

                  <div className={styles.orderItems}>
                    <div className={styles.orderItem}>
                      <span>Status</span>
                      <span className={styles.itemQty}>{e.status ?? "ACTIVE"}</span>
                    </div>
                    {e.role ? (
                      <div className={styles.orderItem}>
                        <span>Role</span>
                        <span className={styles.itemQty}>{e.role}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.orderFooter}>
                    <div style={muted}>Manage access & roles</div>
                    <Link className={styles.payButton} href="/client-admin/employees">
                      Manage
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
  );
}
