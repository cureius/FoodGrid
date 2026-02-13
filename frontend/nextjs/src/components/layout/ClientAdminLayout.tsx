'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, History, MoreHorizontal } from 'lucide-react';
import ClientAdminSidebar from './ClientAdminSidebar';
import ClientAdminHeader from './ClientAdminHeader';
import styles from './ClientAdminLayout.module.css';

interface ClientAdminLayoutProps {
  children: React.ReactNode;
}

const bottomNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/client-admin' },
  { icon: ShoppingCart, label: 'Orders', href: '/client-admin/orders' },
  { icon: Package, label: 'Inventory', href: '/client-admin/inventory' },
  { icon: History, label: 'History', href: '/client-admin/history' },
];

const ClientAdminLayout: React.FC<ClientAdminLayoutProps> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const isActive = (href: string) => {
    if (href === '/client-admin') return pathname === '/client-admin';
    return pathname.startsWith(href);
  };

  return (
    <div className={styles.container}>
      <ClientAdminSidebar isDrawerOpen={drawerOpen} onClose={closeDrawer} />
      <div className={styles.contentWrapper}>
        <ClientAdminHeader onMenuClick={openDrawer} />
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className={styles.bottomNav}>
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.bottomNavItem} ${isActive(item.href) ? styles.bottomNavItemActive : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
        <button
          className={styles.bottomNavItem}
          onClick={openDrawer}
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>

      {/* Drawer overlay */}
      {drawerOpen && <div className={styles.drawerOverlay} onClick={closeDrawer} />}
    </div>
  );
};

export default ClientAdminLayout;
