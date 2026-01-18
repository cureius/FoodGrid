"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LogOut } from "lucide-react";
import { isTenantAdmin } from "@/lib/utils/admin";
import { useEffect } from "react";

export const TenantAdminNavbar = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Redirect if not tenant admin
    if (!isTenantAdmin()) {
      if (typeof globalThis !== 'undefined' && globalThis.location) {
        globalThis.location.href = "/admin-login";
      }
    }
  }, []);

  // Don't show navbar on login page
  if (pathname === "/tenant-admin-login" || pathname === "/admin-login") {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("fg_admin_access_token");
    localStorage.removeItem("fg_admin_refresh_token");
    if (typeof globalThis !== 'undefined' && globalThis.location) {
      globalThis.location.href = "/admin-login";
    }
  };

  return (
    <nav style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-light)',
      padding: '16px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link 
          href="/tenant-admin"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: pathname === '/tenant-admin' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: pathname === '/tenant-admin' ? 600 : 500,
            background: pathname === '/tenant-admin' ? 'rgba(75, 112, 245, 0.1)' : 'transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <Building2 size={18} />
          <span>Dashboard</span>
        </Link>
        
        <Link 
          href="/tenant-admin/tenants"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: pathname?.startsWith('/tenant-admin/tenants') ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: pathname?.startsWith('/tenant-admin/tenants') ? 600 : 500,
            background: pathname?.startsWith('/tenant-admin/tenants') ? 'rgba(75, 112, 245, 0.1)' : 'transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <Building2 size={18} />
          <span>Tenants</span>
        </Link>
      </div>

      <button
        onClick={handleLogout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid var(--border-light)',
          background: 'transparent',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--status-red)';
          e.currentTarget.style.color = 'var(--status-red)';
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-light)';
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </nav>
  );
};
