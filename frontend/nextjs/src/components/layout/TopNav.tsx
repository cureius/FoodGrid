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
  Bell,
  Settings,
  ChevronDown
} from 'lucide-react';
import styles from './TopNav.module.css';
import { cn } from '@/lib/utils';
import Logo from '../Logo';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: ShoppingCart, label: 'Order', href: '/orders' },
  { icon: Utensils, label: 'Table', href: '/tables' },
  { icon: History, label: 'History', href: '/history' },
  { icon: Package, label: 'Inventory', href: '/inventory' },
];

const TopNav = () => {
  const pathname = usePathname();

  return (
    <nav className={styles.topNav}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Utensils size={20} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Logo size={20} />
        <span>FoodGrid</span>
      </div>

      <div className={styles.navCenter}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(styles.navItem, isActive && styles.navItemActive)}
            >
              <item.icon size={18} strokeWidth={2.5} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className={styles.navRight}>
        <button className={styles.iconButton}>
          <Bell size={20} />
          <span className={styles.notificationBadge} />
        </button>

        <button className={styles.iconButton}>
          <Settings size={20} />
        </button>

        <button className={styles.profileButton}>
          <div className={styles.avatar}>RW</div>
          <span className={styles.profileName}>Richard Wilson</span>
          <ChevronDown size={16} color="var(--text-muted)" />
        </button>
      </div>
    </nav>
  );
};

export default TopNav;
