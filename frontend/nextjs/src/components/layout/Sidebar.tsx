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
  { icon: CalendarDays, label: 'Reservation', href: '/reservations' },
  { icon: History, label: 'History', href: '/history' },
  { icon: Package, label: 'Inventory', href: '/inventory' },
  { icon: CreditCard, label: 'Payment', href: '/payments' },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.avatar} style={{ backgroundColor: 'var(--primary)' }}>
          <Utensils size={20} />
        </div>
        <h1 className={styles.logoText}>Food<span>Grid</span></h1>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(styles.navItem, isActive && styles.activeNavItem)}
            >
              <item.icon className={styles.navIcon} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userCard}>
          <div className={styles.avatar}>RW</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>Richard Wilson</p>
            <p className={styles.userRole}>Waiter</p>
          </div>
          <button className={styles.logoutBtn} title="Logout">
            <LogOut size={18} color="var(--danger)" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
