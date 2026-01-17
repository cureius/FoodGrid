import React from 'react';
import TopNav from './TopNav';
import styles from './CloudPosLayout.module.css';

interface CloudPosLayoutProps {
  children: React.ReactNode;
}

const CloudPosLayout: React.FC<CloudPosLayoutProps> = ({ children }) => {
  return (
    <div className={styles.container}>
      <TopNav />
      <div className={styles.pageBody}>
        {children}
      </div>
    </div>
  );
};

export default CloudPosLayout;
