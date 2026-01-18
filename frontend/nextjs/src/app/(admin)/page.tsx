"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, Store, ArrowRight } from "lucide-react";
import { getAdminRole, type AdminRole } from "@/lib/utils/admin";

export default function AdminLandingPage() {
  const router = useRouter();
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fg_admin_access_token");
    if (!token) {
      router.push("/admin-login");
      return;
    }

    const role = getAdminRole();
    setAdminRole(role);
    setLoading(false);

    // Auto-redirect based on role
    if (role === 'TENANT_ADMIN') {
      router.push("/tenant-admin");
    } else if (role === 'CLIENT_ADMIN') {
      router.push("/admin/employees");
    }
  }, [router]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        color: 'var(--text-muted)'
      }}>
        Loading...
      </div>
    );
  }

  const isTenantAdmin = adminRole === 'TENANT_ADMIN';
  const isClientAdmin = adminRole === 'CLIENT_ADMIN';

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
          {isTenantAdmin ? 'Tenant Admin Dashboard' : 'Client Admin Dashboard'}
        </h1>
        <p style={{
          fontSize: '18px',
          color: 'var(--text-muted)'
        }}>
          {isTenantAdmin 
            ? 'Manage all tenants and clients in your system'
            : 'Manage your outlets, employees, and operations'
          }
        </p>
      </div>

      {/* Tenant Admin View */}
      {isTenantAdmin && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          <div
            onClick={() => router.push('/admin/tenants')}
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
      )}

      {/* Client Admin View */}
      {isClientAdmin && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          <div
            onClick={() => router.push('/admin/employees')}
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
                <Users size={28} color="var(--primary)" />
              </div>
              <ArrowRight size={20} color="var(--text-muted)" />
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 700,
              marginBottom: '8px',
              color: 'var(--text-primary)'
            }}>
              Manage Employees
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              lineHeight: '1.6'
            }}>
              Add, edit, and manage employees for your outlets. Assign roles and manage employee access.
            </p>
          </div>

          <div
            onClick={() => router.push('/admin/outlets')}
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
                <Store size={28} color="var(--primary)" />
              </div>
              <ArrowRight size={20} color="var(--text-muted)" />
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 700,
              marginBottom: '8px',
              color: 'var(--text-primary)'
            }}>
              Manage Outlets
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              lineHeight: '1.6'
            }}>
              Create and manage your restaurant outlets. Configure settings, timezones, and outlet details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
