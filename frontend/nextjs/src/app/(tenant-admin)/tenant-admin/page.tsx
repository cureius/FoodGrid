"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight } from "lucide-react";
import { isTenantAdmin } from "@/lib/utils/admin";

export default function TenantAdminLandingPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("fg_admin_access_token");
    if (!token) {
      router.push("/admin-login");
      return;
    }

    // Only tenant admin can access this page
    if (!isTenantAdmin()) {
      router.push("/admin-login");
      return;
    }
  }, [router]);

  return (
    <div style={{
      padding: '48px 32px',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: '100vh',
      background: 'var(--bg-app)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{
          fontSize: '40px',
          fontWeight: 800,
          marginBottom: '12px',
          color: 'var(--text-primary)'
        }}>
          Tenant Admin Dashboard
        </h1>
        <p style={{
          fontSize: '18px',
          color: 'var(--text-muted)'
        }}>
          Manage all tenants and clients in your multitenant system
        </p>
      </div>

      {/* Tenant Admin View */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        <div
          onClick={() => router.push('/tenant-admin/tenants')}
          style={{
            background: 'var(--bg-card)',
            border: '2px solid var(--border-light)',
            borderRadius: '16px',
            padding: '32px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(75, 112, 245, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-light)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(75, 112, 245, 0.1) 0%, rgba(75, 112, 245, 0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={28} color="var(--primary)" />
            </div>
            <ArrowRight size={20} color="var(--text-muted)" />
          </div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 700,
            marginBottom: '8px',
            color: 'var(--text-primary)'
          }}>
            Manage Tenants
          </h3>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            lineHeight: '1.6'
          }}>
            Create, update, and manage all tenants/clients in your multitenant system. Activate or deactivate tenant accounts.
          </p>
        </div>
      </div>
    </div>
  );
}

export function TenantAdminDashboardPage() {
  useEffect(() => {
    const t = localStorage.getItem("fg_tenant_admin_access_token");
    if (!t) window.location.href = "/tenant-admin-login";
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Tenant Admin</h1>
      <div style={{ color: "#666", marginTop: 8 }}>
        Dashboard placeholder. Tenant admin flow is isolated from client-admin and staff.
      </div>
    </div>
  );
}
