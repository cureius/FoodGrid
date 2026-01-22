'use client';

import React from 'react';
import ClientAdminSidebar from './ClientAdminSidebar';
import ClientAdminHeader from './ClientAdminHeader';
import styles from './ClientAdminLayout.module.css';

interface ClientAdminLayoutProps {
  children: React.ReactNode;
}

const ClientAdminLayout: React.FC<ClientAdminLayoutProps> = ({ children }) => {
  return (
    <div className={styles.container}>
      <ClientAdminSidebar />
      <div className={styles.contentWrapper}>
        <ClientAdminHeader />
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default ClientAdminLayout;
