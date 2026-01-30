'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  Settings, 
  History, 
  Package, 
  CreditCard,
  LogOut,
  UtensilsCrossed,
  ShoppingCart,
  Grid3X3
} from 'lucide-react';
import styles from './ClientAdminSidebar.module.css';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/client-admin' },
  { icon: Store, label: 'Outlets', href: '/client-admin/outlets' },
  { icon: Users, label: 'Employees', href: '/client-admin/employees' },
  { icon: Grid3X3, label: 'Tables', href: '/client-admin/tables' },
  { icon: ShoppingCart, label: 'Orders', href: '/client-admin/orders' },
  { icon: History, label: 'History', href: '/client-admin/history' },
  { icon: Package, label: 'Inventory', href: '/client-admin/inventory' },
  { icon: CreditCard, label: 'Payments', href: '/client-admin/payments' },
];

const ClientAdminSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('fg_client_admin_access_token');
    localStorage.removeItem('fg_client_admin_refresh_token');
    router.push('/client-admin/login');
  };

  const isActive = (href: string) => {
    if (href === '/client-admin') {
      return pathname === '/client-admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          <UtensilsCrossed size={24} />
        </div>
        <div className={styles.logoText}>
          <span className={styles.logoMain}>FoodGrid</span>
          <span className={styles.logoSub}>Client Admin</span>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSection}>
          <span className={styles.navSectionTitle}>Main Menu</span>
          {navItems.slice(0, 4).map((item) => (
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
          {navItems.slice(4).map((item) => (
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

export default ClientAdminSidebar;
