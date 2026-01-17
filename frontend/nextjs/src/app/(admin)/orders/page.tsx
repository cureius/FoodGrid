"use client";

import React, { useState } from 'react';
import styles from './Orders.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { 
  Filter, 
  Search, 
  ChevronRight, 
  Clock, 
  MoreVertical,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const ORDERS = [
  { id: 'ORD-1024', table: 'T-04', customer: 'John Doe', items: 3, total: 45.00, status: 'In Progress', progress: 10, time: '2 mins ago' },
  { id: 'ORD-1025', table: 'T-02', customer: 'Sara Lee', items: 2, total: 32.50, status: 'Ready', progress: 100, time: '5 mins ago' },
  { id: 'ORD-1026', table: 'T-08', customer: 'Mike Ross', items: 5, total: 78.00, status: 'Completed', progress: 100, time: '12 mins ago' },
  { id: 'ORD-1027', table: 'T-05', customer: 'Alice Wong', items: 1, total: 12.00, status: 'In Progress', progress: 50, time: '8 mins ago' },
  { id: 'ORD-1028', table: 'T-01', customer: 'Bob Smith', items: 4, total: 56.40, status: 'Ready', progress: 100, time: '1 min ago' },
];

const OrderPage = () => {
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'In Progress', 'Ready', 'Completed'];

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.filterGroup}>
          {filters.map(f => (
            <button 
              key={f}
              className={cn(styles.filterBtn, activeFilter === f && styles.activeFilter)}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        
        <Link href="/orders/new" className={styles.createBtn}>
          <Plus size={20} /> New Order
        </Link>
      </div>

      <div className={styles.orderGrid}>
        {ORDERS.map((order) => (
          <Card key={order.id} className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <div>
                <h4 className={styles.orderId}>{order.id}</h4>
                <p className={styles.orderTime}><Clock size={12} /> {order.time}</p>
              </div>
              <button className={styles.iconBtn}><MoreVertical size={18} /></button>
            </div>

            <div className={styles.orderBody}>
              <div className={styles.detailItem}>
                <span>Table</span>
                <span className={styles.detailValue}>{order.table}</span>
              </div>
              <div className={styles.detailItem}>
                <span>Customer</span>
                <span className={styles.detailValue}>{order.customer}</span>
              </div>
              <div className={styles.detailItem}>
                <span>Items</span>
                <span className={styles.detailValue}>{order.items} items</span>
              </div>
            </div>

            <div className={styles.orderFooter}>
              <div className={styles.progressSection}>
                <div className={styles.progressInfo}>
                  <span>Progress</span>
                  <span>{order.progress}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ 
                      width: `${order.progress}%`,
                      backgroundColor: order.status === 'Ready' ? 'var(--success)' : 
                                       order.status === 'In Progress' ? 'var(--warning)' : 
                                       'var(--text-muted)'
                    }} 
                  />
                </div>
              </div>
              
              <div className={styles.footerBottom}>
                <h3 className={styles.totalPrice}>${order.total.toFixed(2)}</h3>
                <Badge 
                  variant={
                    order.status === 'Ready' ? 'success' : 
                    order.status === 'In Progress' ? 'warning' : 'neutral'
                  }
                >
                  {order.status}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OrderPage;
