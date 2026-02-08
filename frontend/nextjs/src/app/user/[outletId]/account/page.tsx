"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { 
  ChevronLeft, User, MapPin, CreditCard, Bell, Shield, LogOut, 
  ChevronRight, Settings, Heart, Gift, Phone, Mail, Calendar,
  Award, Star, TrendingUp, Clock, HelpCircle, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AccountPage() {
  const router = useRouter();
  const params = useParams();
  const outletId = params?.outletId as string;
  const { user, logout, isAuthenticated } = useAuthStore();
  const [isMounting, setIsMounting] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
     setIsMounting(false);
  }, []);

  useEffect(() => {
    if (!isMounting && !isAuthenticated) {
      router.replace(outletId ? `/user/${outletId}` : '/user/outlets');
    }
  }, [isAuthenticated, router, isMounting, outletId]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  const menuGroups = [
    {
      title: 'Personal',
      items: [
        { label: 'Profile Information', icon: User, value: user?.displayName || 'Guest User', badge: null },
        { label: 'Phone Number', icon: Phone, value: user?.mobileNumber ? `+91 ${user.mobileNumber}` : '+91 9876543210', badge: null },
        { label: 'Email Address', icon: Mail, value: 'Not set', badge: 'Add' },
        { label: 'Saved Addresses', icon: MapPin, value: '2 addresses', badge: null },
        { label: 'My Favorites', icon: Heart, value: '8 items', badge: null },
      ]
    },
    {
      title: 'Payments & Rewards',
      items: [
        { label: 'Payment Methods', icon: CreditCard, value: 'Visa •••• 4022', badge: null },
        { label: 'Coins & Rewards', icon: Gift, value: '240 Coins', badge: 'Hot' },
        { label: 'Membership Tier', icon: Award, value: 'Gold Member', badge: null },
      ]
    },
    {
      title: 'Activity',
      items: [
        { label: 'Order History', icon: Clock, value: '12 orders', badge: null },
        { label: 'Reviews & Ratings', icon: Star, value: '5 reviews', badge: null },
      ]
    },
    {
      title: 'App Settings',
      items: [
        { label: 'Notifications', icon: Bell, value: 'Enabled', badge: null },
        { label: 'Privacy & Security', icon: Shield, value: null, badge: null },
        { label: 'App Preferences', icon: Settings, value: null, badge: null },
      ]
    },
    {
      title: 'Support',
      items: [
        { label: 'Help Center', icon: HelpCircle, value: null, badge: null },
        { label: 'Contact Support', icon: MessageCircle, value: null, badge: null },
      ]
    }
  ];

  // Calculate member stats
  const memberSince = '2024';
  const totalOrders = 12;
  const totalSpent = 4250;
  const loyaltyPoints = 240;

  return (
    <div className="account-page">
      <header className="account-header">
        <button onClick={() => router.push(outletId ? `/user/${outletId}` : '/user/outlets')} className="back-btn">
          <ChevronLeft size={24} />
        </button>
        <h1 className="header-title">My Account</h1>
      </header>

      <main className="account-main">
        {/* Enhanced Profile Card */}
        <motion.div 
          className="profile-card card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="profile-gradient" />
          <div className="profile-content">
            <div className="profile-top">
              <div className="avatar-wrap">
                <User size={36} strokeWidth={2.5} />
                <div className="avatar-badge">
                  <Star size={12} fill="currentColor" />
                </div>
              </div>
              <div className="user-info">
                <h2 className="user-name">{user?.displayName || 'Guest User'}</h2>
                <p className="user-phone">
                  <Phone size={10} />
                  +91 {user?.mobileNumber || '9876543210'}
                </p>
                <div className="member-badge">
                  <Award size={10} />
                  <span>Gold Member</span>
                </div>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon orders">
                  <TrendingUp size={16} />
                </div>
                <div className="stat-content">
                  <span className="stat-val">{totalOrders}</span>
                  <span className="stat-label">Orders</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon spent">
                  <CreditCard size={16} />
                </div>
                <div className="stat-content">
                  <span className="stat-val">₹{totalSpent}</span>
                  <span className="stat-label">Spent</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon points">
                  <Gift size={16} />
                </div>
                <div className="stat-content">
                  <span className="stat-val">{loyaltyPoints}</span>
                  <span className="stat-label">Points</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon member">
                  <Calendar size={16} />
                </div>
                <div className="stat-content">
                  <span className="stat-val">{memberSince}</span>
                  <span className="stat-label">Member</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Menu Groups */}
        <div className="menu-groups">
          {menuGroups.map((group, groupIndex) => (
            <motion.div 
              key={group.title} 
              className="menu-group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * (groupIndex + 1) }}
            >
              <h3 className="group-title">{group.title}</h3>
              <div className="group-card card">
                {group.items.map((item, index) => (
                  <button 
                    key={item.label}
                    className="menu-row"
                  >
                    <div className="row-icon-wrap">
                      <item.icon size={18} strokeWidth={2.5} />
                    </div>
                    <span className="row-label">{item.label}</span>
                    {item.badge && (
                      <span className={`row-badge ${item.badge.toLowerCase()}`}>
                        {item.badge}
                      </span>
                    )}
                    {item.value && (
                      <span className="row-value">{item.value}</span>
                    )}
                    <ChevronRight size={16} className="row-arrow" />
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.button 
          onClick={handleLogout}
          className="logout-btn"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut size={20} />
          LOG OUT
        </motion.button>

        <p className="app-version">
          FoodGrid Customer App v1.0.4 • Build 823
        </p>
      </main>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <>
            <motion.div 
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
            />
            <motion.div 
              className="logout-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="modal-icon">
                <LogOut size={32} />
              </div>
              <h3 className="modal-title">Logout Confirmation</h3>
              <p className="modal-text">Are you sure you want to logout? You'll need to login again to place orders.</p>
              <div className="modal-actions">
                <button className="modal-btn cancel" onClick={() => setShowLogoutConfirm(false)}>
                  Cancel
                </button>
                <button className="modal-btn confirm" onClick={confirmLogout}>
                  Yes, Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx>{`
        .account-page { 
          background: var(--bg-app); 
          min-height: 100vh; 
          padding-bottom: 96px; 
        }
        
        .account-header { 
          position: sticky;
          top: 0; 
          z-index: 40; 
          background: rgba(var(--bg-surface-rgb), 0.9);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-light); 
          height: 64px; 
          display: flex; 
          align-items: center; 
          padding: 0 16px; 
          gap: 16px; 
        }
        .back-btn { 
          padding: 8px; 
          margin-left: -8px; 
          color: var(--text-main);
          border-radius: 12px;
          transition: var(--transition-fast);
        }
        .back-btn:hover {
          background: var(--bg-muted);
        }
        .header-title { 
          font-size: 18px; 
          font-weight: 800; 
          color: var(--text-main); 
          letter-spacing: -0.5px; 
        }

        .account-main { 
          padding: 20px 16px; 
          display: flex; 
          flex-direction: column; 
          gap: 24px; 
        }
        
        .card { 
          background: var(--bg-surface); 
          border-radius: 24px; 
          border: 1px solid var(--border-light); 
          box-shadow: var(--shadow-md); 
          overflow: hidden;
          transition: var(--transition-normal);
        }
        
        .profile-card { 
          position: relative;
          padding: 0;
          overflow: hidden;
        }
        
        .profile-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 120px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          opacity: 0.08;
        }
        
        .profile-content {
          position: relative;
          padding: 24px;
        }
        
        .profile-top { 
          display: flex; 
          align-items: flex-start; 
          gap: 16px; 
          margin-bottom: 24px; 
        }
        
        .avatar-wrap { 
          position: relative;
          width: 72px; 
          height: 72px; 
          background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary-light) 100%);
          border-radius: 20px; 
          border: 3px solid var(--bg-surface);
          box-shadow: var(--shadow-lg);
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: var(--primary);
          flex-shrink: 0;
        }
        
        .avatar-badge {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, var(--warning) 0%, var(--secondary) 100%);
          border-radius: 8px;
          border: 2px solid var(--bg-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .user-info { 
          display: flex; 
          flex-direction: column; 
          gap: 6px;
          flex: 1;
        }
        
        .user-name { 
          font-size: 22px; 
          font-weight: 800; 
          color: var(--text-main);
          letter-spacing: -0.5px;
          line-height: 1.2;
        }
        
        .user-phone { 
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px; 
          font-weight: 600; 
          color: var(--text-secondary);
        }
        
        .member-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: linear-gradient(135deg, rgba(255, 169, 77, 0.15) 0%, rgba(251, 191, 36, 0.15) 100%);
          border: 1px solid var(--warning);
          border-radius: 8px;
          font-size: 11px;
          font-weight: 800;
          color: var(--warning);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          width: fit-content;
        }
        
        .stats-grid { 
          display: grid; 
          grid-template-columns: repeat(2, 1fr); 
          gap: 12px; 
        }
        
        .stat-item { 
          background: var(--bg-muted);
          border-radius: 16px; 
          padding: 16px; 
          border: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          gap: 12px;
          transition: var(--transition-fast);
        }
        
        .stat-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        
        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .stat-icon.orders {
          background: var(--primary-light);
          color: var(--primary);
        }
        
        .stat-icon.spent {
          background: var(--success-light);
          color: var(--success);
        }
        
        .stat-icon.points {
          background: var(--secondary-light);
          color: var(--secondary);
        }
        
        .stat-icon.member {
          background: var(--info-light);
          color: var(--info);
        }
        
        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .stat-label { 
          font-size: 10px; 
          font-weight: 700; 
          color: var(--text-secondary);
          text-transform: uppercase; 
          letter-spacing: 0.5px;
        }
        
        .stat-val { 
          font-size: 16px; 
          font-weight: 800; 
          color: var(--text-main);
          line-height: 1;
        }

        .menu-groups { 
          display: flex; 
          flex-direction: column; 
          gap: 24px; 
        }
        
        .menu-group { 
          display: flex; 
          flex-direction: column; 
          gap: 10px; 
        }
        
        .group-title { 
          font-size: 11px; 
          font-weight: 800; 
          color: var(--text-secondary);
          text-transform: uppercase; 
          letter-spacing: 1px; 
          padding-left: 4px; 
        }
        
        .menu-row { 
          width: 100%; 
          min-height: 64px;
          padding: 12px 20px; 
          display: flex; 
          align-items: center; 
          gap: 14px; 
          border-bottom: 1px solid var(--border-light);
          transition: var(--transition-fast); 
        }
        
        .menu-row:last-child { 
          border-bottom: none; 
        }
        
        .menu-row:active { 
          background: var(--bg-muted); 
        }
        
        .row-icon-wrap { 
          width: 40px; 
          height: 40px; 
          background: var(--bg-muted);
          border-radius: 12px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: var(--text-secondary);
          transition: var(--transition-fast);
          flex-shrink: 0;
        }
        
        .menu-row:hover .row-icon-wrap { 
          background: var(--primary-light); 
          color: var(--primary);
          transform: scale(1.05);
        }
        
        .row-label { 
          flex: 1; 
          font-size: 14px; 
          font-weight: 700; 
          color: var(--text-main);
          text-align: left; 
        }
        
        .row-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .row-badge.add {
          background: var(--primary-light);
          color: var(--primary);
        }
        
        .row-badge.hot {
          background: linear-gradient(135deg, var(--danger) 0%, var(--secondary) 100%);
          color: white;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        .row-value { 
          font-size: 12px; 
          font-weight: 600; 
          color: var(--text-secondary);
        }
        
        .row-arrow { 
          color: var(--text-light);
          transition: var(--transition-fast);
          flex-shrink: 0;
        }
        
        .menu-row:hover .row-arrow { 
          transform: translateX(4px); 
          color: var(--primary); 
        }

        .logout-btn { 
          width: 100%; 
          height: 56px; 
          background: var(--bg-surface);
          border: 2px solid var(--danger);
          border-radius: 16px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 10px; 
          color: var(--danger); 
          font-size: 13px; 
          font-weight: 800; 
          text-transform: uppercase; 
          letter-spacing: 1px;
          transition: var(--transition-fast);
          margin-top: 8px;
        }
        
        .logout-btn:hover { 
          background: var(--danger-light);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .app-version { 
          text-align: center; 
          font-size: 10px; 
          font-weight: 600; 
          color: var(--text-light);
          letter-spacing: 0.5px;
          padding: 16px 0 32px;
          opacity: 0.6;
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: var(--bg-overlay);
          backdrop-filter: blur(4px);
          z-index: 100;
        }
        
        .logout-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: calc(100% - 48px);
          max-width: 360px;
          background: var(--bg-surface);
          border-radius: 24px;
          padding: 32px 24px 24px;
          box-shadow: var(--shadow-premium);
          z-index: 101;
          border: 1px solid var(--border-light);
        }
        
        .modal-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
          background: var(--danger-light);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--danger);
        }
        
        .modal-title {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-main);
          text-align: center;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
        }
        
        .modal-text {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          text-align: center;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        
        .modal-actions {
          display: flex;
          gap: 12px;
        }
        
        .modal-btn {
          flex: 1;
          height: 48px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: var(--transition-fast);
        }
        
        .modal-btn.cancel {
          background: var(--bg-muted);
          color: var(--text-main);
          border: 1px solid var(--border-light);
        }
        
        .modal-btn.cancel:hover {
          background: var(--component-hover);
        }
        
        .modal-btn.confirm {
          background: var(--danger);
          color: white;
          border: none;
        }
        
        .modal-btn.confirm:hover {
          background: var(--danger);
          opacity: 0.9;
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
      `}</style>
    </div>
  );
}
