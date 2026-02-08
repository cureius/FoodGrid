"use client";

import React, { useEffect, useState } from "react";
import { 
  Building2, Users, Target, LayoutDashboard, 
  Settings, LogOut, ChevronLeft, ChevronRight,
  TrendingUp, Activity
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function InternalAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("fg_admin_access_token") || localStorage.getItem("fg_tenant_admin_access_token");
    if (!token) {
       window.location.href = "/tenant-admin-login";
       return;
    }
    setIsAuthorized(true);
  }, []);

  if (isAuthorized === null) return null;

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/tenant-admin" },
    { name: "Lead Discovery", icon: Target, href: "/leads" },
    { name: "Outreach", icon: TrendingUp, href: "/leads/outreach" },
    { name: "Internal Logs", icon: Activity, href: "/logs" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      {/* Sidebar */}
      <div style={{ 
        width: collapsed ? 80 : 260, 
        background: "white", 
        borderRight: "1px solid #e2e8f0",
        transition: "width 0.3s ease",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh"
      }}>
        {/* Logo */}
        <div style={{ padding: "24px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ minWidth: 40, height: 40, background: "var(--primary)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 color="white" size={24} />
          </div>
          {!collapsed && <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px" }}>FoodGrid <span style={{ color: "var(--primary)", fontSize: 12 }}>PRO</span></span>}
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: "24px 12px" }}>
           {menuItems.map((item, i) => {
             const active = pathname === item.href || pathname.startsWith(item.href + "/");
             return (
               <Link key={i} href={item.href} style={{ 
                 display: "flex", 
                 alignItems: "center", 
                 gap: 12, 
                 padding: "12px 16px", 
                 borderRadius: 12,
                 textDecoration: "none",
                 color: active ? "var(--primary)" : "#64748b",
                 background: active ? "rgba(var(--primary-rgb), 0.08)" : "transparent",
                 marginBottom: 4,
                 transition: "all 0.2s",
                 fontWeight: active ? 600 : 500,
                 fontSize: 14
               }}>
                 <item.icon size={20} />
                 {!collapsed && <span>{item.name}</span>}
               </Link>
             );
           })}
        </div>

        {/* Footer */}
        <div style={{ padding: 12, borderTop: "1px solid #f1f5f9" }}>
           <button 
             onClick={() => setCollapsed(!collapsed)}
             style={{ 
               width: "100%", 
               padding: 12, 
               border: "none", 
               background: "transparent", 
               borderRadius: 10, 
               display: "flex", 
               alignItems: "center", 
               justifyContent: collapsed ? "center" : "flex-start", 
               gap: 12,
               cursor: "pointer",
               color: "#94a3b8"
             }}
           >
             {collapsed ? <ChevronRight size={20} /> : <><ChevronLeft size={20} /> <span style={{ fontSize: 13 }}>Collapse</span></>}
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowX: "hidden" }}>
         {children}
      </div>
    </div>
  );
}
