"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Users, Store, LogOut } from "lucide-react";
import { getAdminRole, type AdminRole } from "@/lib/utils/admin";

export const AdminNavbar = () => {
  const pathname = usePathname();
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);

  useEffect(() => {
    setAdminRole(getAdminRole());
  }, []);

  // Don't show navbar on login page or tenant-admin routes
  if (pathname === "/admin-login" || pathname?.startsWith("/tenant-admin")) {
    return null;
  }

  // Only show for client admin routes
  if (adminRole === 'TENANT_ADMIN') {
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
        {/* Client Admin Navigation - Employees and Outlets */}
        <Link 
          href="/admin/employees"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: pathname?.startsWith('/admin/employees') ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: pathname?.startsWith('/admin/employees') ? 600 : 500,
            background: pathname?.startsWith('/admin/employees') ? 'rgba(75, 112, 245, 0.1)' : 'transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <Users size={18} />
          <span>Employees</span>
        </Link>
        
        <Link 
          href="/admin/outlets"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: pathname?.startsWith('/admin/outlets') ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: pathname?.startsWith('/admin/outlets') ? 600 : 500,
            background: pathname?.startsWith('/admin/outlets') ? 'rgba(75, 112, 245, 0.1)' : 'transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <Store size={18} />
          <span>Outlets</span>
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
