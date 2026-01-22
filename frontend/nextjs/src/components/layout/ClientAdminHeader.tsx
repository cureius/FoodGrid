'use client';

import React from 'react';
import { useOutlet } from '@/contexts/OutletContext';
import { ChevronDown, Store } from 'lucide-react';
import styles from './ClientAdminHeader.module.css';

const ClientAdminHeader: React.FC = () => {
  const { selectedOutlet, outlets, setSelectedOutletId, loading } = useOutlet();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const handleSelectOutlet = (outletId: string) => {
    setSelectedOutletId(outletId);
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.outletSelector}`)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.outletSelector}>
          <button
            className={styles.outletButton}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={loading || outlets.length === 0}
            title={selectedOutlet?.name || 'Select Outlet'}
          >
            <Store size={18} className={styles.outletIcon} />
            <span className={styles.outletName}>
              {loading ? 'Loading...' : selectedOutlet?.name || 'Select Outlet'}
            </span>
            <ChevronDown 
              size={16} 
              className={`${styles.chevron} ${isDropdownOpen ? styles.chevronOpen : ''}`}
            />
          </button>
          
          {isDropdownOpen && outlets.length > 0 && (
            <div className={styles.dropdown}>
              {outlets.map((outlet) => (
                <button
                  key={outlet.id}
                  className={`${styles.dropdownItem} ${
                    selectedOutlet?.id === outlet.id ? styles.dropdownItemActive : ''
                  }`}
                  onClick={() => handleSelectOutlet(outlet.id)}
                >
                  <Store size={16} className={styles.dropdownIcon} />
                  <span>{outlet.name}</span>
                  {selectedOutlet?.id === outlet.id && (
                    <span className={styles.checkmark}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ClientAdminHeader;
