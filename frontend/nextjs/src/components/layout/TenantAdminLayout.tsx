'use client';

import React from 'react';
import TenantAdminSidebar from './TenantAdminSidebar';
import styles from './TenantAdminLayout.module.css';

interface TenantAdminLayoutProps {
  children: React.ReactNode;
}

const TenantAdminLayout: React.FC<TenantAdminLayoutProps> = ({ children }) => {
  return (
    <div className={styles.container}>
      <TenantAdminSidebar />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
};

export default TenantAdminLayout;
