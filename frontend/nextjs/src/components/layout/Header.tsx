'use client';

import React from 'react';
import { Search, Bell, Settings, Moon, Sun } from 'lucide-react';
import styles from './Header.module.css';
import { usePathname } from 'next/navigation';

const Header = () => {
  const pathname = usePathname();
  
  // Map pathname to title
  const getPageTitle = (path: string) => {
    if (path.includes('dashboard')) return 'Dashboard Overview';
    if (path.includes('orders')) return 'Order List';
    if (path.includes('tables')) return 'Table Management';
    if (path.includes('reservations')) return 'Reservations';
    if (path.includes('history')) return 'Order History';
    if (path.includes('inventory')) return 'Inventory Management';
    if (path.includes('payments')) return 'Payments & Billing';
    return 'FoodGrid POS';
  };

  return (
    <header className={styles.header}>
      <div className={styles.titleContainer}>
        <h2>{getPageTitle(pathname)}</h2>
      </div>

      <div className={styles.actions}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            placeholder="Search orders, items..." 
            className={styles.searchInput}
          />
        </div>

        <button className={styles.actionBtn}>
          <Moon size={20} />
        </button>

        <button className={cn(styles.actionBtn, styles.badge)}>
          <Bell size={20} />
        </button>

        <button className={styles.actionBtn}>
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
};

// I need to import cn here or just use template literals. 
// Adding the import and defining cn helper if needed but it's in @/lib/utils
import { cn } from '@/lib/utils';

export default Header;
