'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Utensils, 
  CalendarDays, 
  History, 
  Package, 
  CreditCard,
  LogOut
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: ShoppingCart, label: 'Order', href: '/orders' },
  { icon: Utensils, label: 'Table', href: '/tables' },
  { icon: History, label: 'History', href: '/history' },
  { icon: Package, label: 'Inventory', href: '/inventory' },
  { icon: CreditCard, label: 'Payment', href: '/payments' },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoBadge}>
          <Utensils size={22} strokeWidth={2.5} />
        </div>
        <div className={styles.logoTextWrapper}>
          <h1 className={styles.logoText}>Food<span>Grid</span></h1>
          <span className={styles.logoTagline}>Smart POS System</span>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navGroup}>
          <span className={styles.navGroupTitle}>Operations</span>
          {navItems.slice(0, 3).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(styles.navItem, isActive && styles.activeNavItem)}
              >
                <div className={styles.navIconWrapper}>
                  <item.icon className={styles.navIcon} size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span>{item.label}</span>
                {isActive && <div className={styles.activeIndicator} />}
              </Link>
            );
          })}
        </div>

        <div className={styles.navGroup}>
          <span className={styles.navGroupTitle}>Inventory & Finance</span>
          {navItems.slice(3).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(styles.navItem, isActive && styles.activeNavItem)}
              >
                <div className={styles.navIconWrapper}>
                  <item.icon className={styles.navIcon} size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span>{item.label}</span>
                {isActive && <div className={styles.activeIndicator} />}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className={styles.footer}>
        <div className={styles.userSection}>
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>RW</div>
            <div className={styles.userMeta}>
              <span className={styles.userName}>Richard Wilson</span>
              <span className={styles.userRole}>Head Waiter</span>
            </div>
          </div>
          <button className={styles.logoutAction} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
