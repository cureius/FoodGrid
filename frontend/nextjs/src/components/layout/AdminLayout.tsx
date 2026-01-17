import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import styles from './AdminLayout.module.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.mainContent}>
        <Header />
        <div className={styles.pageBody}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
