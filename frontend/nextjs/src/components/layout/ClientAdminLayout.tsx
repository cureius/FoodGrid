'use client';

import React from 'react';
import ClientAdminSidebar from './ClientAdminSidebar';
import styles from './ClientAdminLayout.module.css';

interface ClientAdminLayoutProps {
  children: React.ReactNode;
}

const ClientAdminLayout: React.FC<ClientAdminLayoutProps> = ({ children }) => {
  return (
    <div className={styles.container}>
      <ClientAdminSidebar />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
};

export default ClientAdminLayout;
