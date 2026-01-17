'use client';

import React from 'react';
import styles from './Dashboard.module.css';
import { Clock, TrendingUp, Users, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={styles.container}>
      {/* Greeting & create order */}
      <div className={styles.greetingSection}>
        <div>
          <h1 className={styles.greeting}>Good Morning, Richardo</h1>
          <p className={styles.subGreeting}>
            Give your best services for customers, happy working 🫶
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <div className={styles.time}>{currentTime}</div>
            <div className={styles.date}>{currentDate}</div>
          </div>
          <button className={styles.createOrderButton}>+ Create New Order</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #4B70F5 0%, #FFFFFF 100%)' }}>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Total Earnings</div>
            <div className={styles.statValue}>US$ 12,450.00</div>
            <div className={styles.statChange}>
              <TrendingUp size={14} />
              <span>+12.5% from yesterday</span>
            </div>
          </div>
          <div className={styles.statIconWrapper}>
            <TrendingUp size={32} strokeWidth={2} />
          </div>
        </div>

        <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #F69B42 0%, #FFFFFF 100%)' }}>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>In Progress</div>
            <div className={styles.statValue}>12</div>
            <div className={styles.statChange}>
              <span>4 orders in kitchen</span>
            </div>
          </div>
          <div className={styles.statIconWrapper}>
            <Clock size={32} strokeWidth={2} />
          </div>
        </div>

        <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #10B981 0%, #FFFFFF 100%)' }}>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Ready to Served</div>
            <div className={styles.statValue}>08</div>
            <div className={styles.statChange}>
              <span>2 orders ready</span>
            </div>
          </div>
          <div className={styles.statIconWrapper}>
            <CheckCircle size={32} strokeWidth={2} />
          </div>
        </div>

        <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #FFFFFF 100%)' }}>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Completed</div>
            <div className={styles.statValue}>45</div>
            <div className={styles.statChange}>
              <span>+5 from yesterday</span>
            </div>
          </div>
          <div className={styles.statIconWrapper}>
            <Users size={32} strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* Order Sections */}
      <div className={styles.orderSections}>
        <div className={styles.orderColumn}>
          <div className={styles.sectionHeader}>
            <h3>In Progress</h3>
            <span className={styles.badge}>10% In Progress</span>
          </div>
          <div className={styles.orderList}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.tableCircle} style={{ background: '#F69B42' }}>
                    T{i}
                  </div>
                  <div className={styles.orderInfo}>
                    <div className={styles.orderId}>DI10{i}</div>
                    <div className={styles.orderTime}>2 mins ago</div>
                  </div>
                </div>
                <div className={styles.orderItems}>
                  <div className={styles.orderItem}>
                    <span>Chicken Burger</span>
                    <span className={styles.itemQty}>x2</span>
                  </div>
                  <div className={styles.orderItem}>
                    <span>French Fries</span>
                    <span className={styles.itemQty}>x1</span>
                  </div>
                </div>
                <div className={styles.orderFooter}>
                  <span className={styles.orderTotal}>US$ 45.00</span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '30%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.orderColumn}>
          <div className={styles.sectionHeader}>
            <h3>Waiting for Payments</h3>
            <span className={styles.badge}>3 Orders</span>
          </div>
          <div className={styles.orderList}>
            {[4, 5, 6].map((i) => (
              <div key={i} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.tableCircle} style={{ background: '#4B70F5' }}>
                    T{i}
                  </div>
                  <div className={styles.orderInfo}>
                    <div className={styles.orderId}>DI10{i}</div>
                    <div className={styles.orderTime}>5 mins ago</div>
                  </div>
                </div>
                <div className={styles.orderItems}>
                  <div className={styles.orderItem}>
                    <span>Grilled Salmon</span>
                    <span className={styles.itemQty}>x1</span>
                  </div>
                  <div className={styles.orderItem}>
                    <span>Caesar Salad</span>
                    <span className={styles.itemQty}>x1</span>
                  </div>
                </div>
                <div className={styles.orderFooter}>
                  <span className={styles.orderTotal}>US$ 62.00</span>
                  <button className={styles.payButton}>Pay Bills</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
