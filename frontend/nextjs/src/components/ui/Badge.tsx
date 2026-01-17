import React from 'react';
import styles from './Badge.module.css';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className }) => {
  return (
    <span className={cn(styles.badge, styles[variant], className)}>
      {children}
    </span>
  );
};

export default Badge;
