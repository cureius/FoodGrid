import React from 'react';
import styles from './Card.module.css';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  variant?: 'premium' | 'outline' | 'flat';
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  style,
  onClick, 
  variant = 'premium' 
}) => {
  return (
    <div 
      className={cn(
        styles.card, 
        styles[variant],
        onClick && styles.clickable,
        className
      )}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
};


export default Card;
