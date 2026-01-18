'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  CreditCard,
  LogOut,
  ShieldCheck,
  BarChart3,
  FileText,
  Bell
} from 'lucide-react';
import styles from './TenantAdminSidebar.module.css';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/tenant-admin' },
  { icon: Building2, label: 'Tenants', href: '/tenant-admin/tenants' },
  { icon: Users, label: 'Users', href: '/tenant-admin/users' },
  { icon: CreditCard, label: 'Subscriptions', href: '/tenant-admin/subscriptions' },
  { icon: BarChart3, label: 'Analytics', href: '/tenant-admin/analytics' },
  { icon: FileText, label: 'Reports', href: '/tenant-admin/reports' },
  { icon: Bell, label: 'Notifications', href: '/tenant-admin/notifications' },
  { icon: Settings, label: 'Settings', href: '/tenant-admin/settings' },
];

const TenantAdminSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('fg_tenant_admin_access_token');
    localStorage.removeItem('fg_tenant_admin_refresh_token');
    localStorage.removeItem('fg_admin_access_token');
    localStorage.removeItem('fg_admin_refresh_token');
    router.push('/tenant-admin-login');
  };

  const isActive = (href: string) => {
    if (href === '/tenant-admin') {
      return pathname === '/tenant-admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          <ShieldCheck size={24} />
        </div>
        <div className={styles.logoText}>
          <span className={styles.logoMain}>FoodGrid</span>
          <span className={styles.logoSub}>Tenant Admin</span>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSection}>
          <span className={styles.navSectionTitle}>Overview</span>
          {navItems.slice(0, 2).map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href) ? styles.activeNavItem : ''}`}
            >
              <item.icon className={styles.navIcon} size={20} strokeWidth={isActive(item.href) ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className={styles.navSection}>
          <span className={styles.navSectionTitle}>Management</span>
          {navItems.slice(2, 6).map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href) ? styles.activeNavItem : ''}`}
            >
              <item.icon className={styles.navIcon} size={20} strokeWidth={isActive(item.href) ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className={styles.navSection}>
          <span className={styles.navSectionTitle}>System</span>
          {navItems.slice(6).map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href) ? styles.activeNavItem : ''}`}
            >
              <item.icon className={styles.navIcon} size={20} strokeWidth={isActive(item.href) ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className={styles.footer}>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default TenantAdminSidebar;
