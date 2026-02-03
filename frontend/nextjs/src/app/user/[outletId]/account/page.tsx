"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { ChevronLeft, User, MapPin, CreditCard, Bell, Shield, LogOut, ChevronRight, Settings, Heart, Gift } from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const params = useParams();
  const outletId = params?.outletId as string;
  const { user, logout, isAuthenticated } = useAuthStore();
  const [isMounting, setIsMounting] = useState(true);

  useEffect(() => {
     setIsMounting(false);
  }, []);

  useEffect(() => {
    if (!isMounting && !isAuthenticated) {
      router.replace(outletId ? `/user/${outletId}` : '/user/outlets');
    }
  }, [isAuthenticated, router, isMounting, outletId]);

  const menuGroups = [
    {
      title: 'Personal',
      items: [
        { label: 'Profile Information', icon: User, value: user?.displayName || 'Sourajit' },
        { label: 'Saved Addresses', icon: MapPin, value: '2 Home, Office' },
        { label: 'My Favorites', icon: Heart },
      ]
    },
    {
      title: 'Payments & Rewards',
      items: [
        { label: 'Payment Methods', icon: CreditCard, value: 'Visa 4022' },
        { label: 'Coins & Rewards', icon: Gift, value: '240 Coins' },
      ]
    },
    {
      title: 'App Settings',
      items: [
        { label: 'Notifications', icon: Bell },
        { label: 'Privacy & Security', icon: Shield },
        { label: 'App Settings', icon: Settings },
      ]
    }
  ];

  return (
    <div className="account-page">
      <header className="account-header">
        <button onClick={() => router.push(outletId ? `/user/${outletId}` : '/user/outlets')} className="back-btn">
          <ChevronLeft size={24} />
        </button>
        <h1 className="header-title">My Profile</h1>
      </header>

      <main className="account-main">
        {/* Profile Card */}
        <div className="profile-card card">
            <div className="profile-top">
                <div className="avatar-wrap">
                    <User size={40} />
                </div>
                <div className="user-info">
                    <h2 className="user-name">{user?.displayName || 'GUEST'}</h2>
                    <p className="user-phone">+91 {user?.mobileNumber || '9876543210'}</p>
                </div>
            </div>

            <div className="stats-row">
                <div className="stat-item">
                    <span className="stat-label">Orders</span>
                    <span className="stat-val">12</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Member</span>
                    <span className="stat-val">2024</span>
                </div>
            </div>
        </div>

        {/* Menu Groups */}
        <div className="menu-groups">
            {menuGroups.map(group => (
                <div key={group.title} className="menu-group">
                    <h3 className="group-title">{group.title}</h3>
                    <div className="group-card card">
                        {group.items.map(item => (
                            <button 
                                key={item.label}
                                className="menu-row"
                            >
                                <div className="row-icon-wrap">
                                    <item.icon size={18} />
                                </div>
                                <span className="row-label">{item.label}</span>
                                {item.value && (
                                    <span className="row-value">{item.value}</span>
                                )}
                                <ChevronRight size={16} className="row-arrow" />
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>

        <button 
            onClick={() => { if(confirm('Are you sure?')) logout(); }}
            className="logout-btn"
        >
            <LogOut size={20} />
            LOG OUT
        </button>

        <p className="app-version">
            FoodGrid Customer App v1.0.4 • Build 823
        </p>
      </main>

      <style jsx>{`
        .account-page { background: var(--bg-app); min-height: 100vh; padding-bottom: 96px; }
        .account-header { top: 0; z-index: 40; background: white; border-bottom: 1px solid var(--border-light); height: 64px; display: flex; align-items: center; padding: 0 16px; gap: 16px; }
        .back-btn { padding: 4px; margin-left: -4px; color: var(--navy); }
        .header-title { font-size: 18px; font-weight: 800; color: var(--navy); text-transform: uppercase; letter-spacing: 0.5px; }

        .account-main { padding: 16px; display: flex; flex-direction: column; gap: 32px; }
        .card { background: white; border-radius: 32px; border: 1px solid var(--border-light); box-shadow: var(--shadow-sm); overflow: hidden; }
        
        .profile-card { padding: 24px; }
        .profile-top { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; }
        .avatar-wrap { width: 80px; height: 80px; background: var(--primary-light); border-radius: 30px; border: 4px solid rgba(75, 112, 245, 0.05); display: flex; align-items: center; justify-content: center; color: var(--primary); box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); }
        .user-info { display: flex; flex-direction: column; gap: 4px; }
        .user-name { font-size: 24px; font-weight: 800; color: var(--navy); }
        .user-phone { font-size: 11px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px; }
        
        .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .stat-item { background: var(--bg-muted); border-radius: 16px; padding: 16px; text-align: center; border: 1px solid rgba(0,0,0,0.02); }
        .stat-label { display: block; font-size: 9px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
        .stat-val { font-size: 18px; font-weight: 800; color: var(--navy); }

        .menu-groups { display: flex; flex-direction: column; gap: 32px; }
        .menu-group { display: flex; flex-direction: column; gap: 12px; }
        .group-title { font-size: 10px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px; padding-left: 4px; }
        
        .menu-row { width: 100%; height: 64px; padding: 0 20px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid var(--bg-muted); transition: var(--transition-fast); }
        .menu-row:last-child { border-bottom: none; }
        .menu-row:active { background: var(--bg-muted); }
        .row-icon-wrap { width: 36px; height: 36px; background: var(--bg-app); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--text-light); transition: var(--transition-fast); }
        .menu-row:hover .row-icon-wrap { background: var(--primary-light); color: var(--primary); }
        .row-label { flex: 1; font-size: 14px; font-weight: 800; color: var(--navy); text-align: left; }
        .row-value { font-size: 11px; font-weight: 700; color: var(--text-light); }
        .row-arrow { color: var(--border-medium); transition: var(--transition-fast); }
        .menu-row:hover .row-arrow { transform: translateX(4px); color: var(--primary); }

        .logout-btn { width: 100%; height: 64px; background: white; border: 2px dashed var(--danger-light); border-radius: 32px; display: flex; align-items: center; justify-content: center; gap: 12px; color: var(--danger); font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; transition: var(--transition-fast); }
        .logout-btn:hover { background: var(--danger-light); }
        .logout-btn:active { transform: scale(0.98); }

        .app-version { text-align: center; font-size: 9px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 2.5px; padding-bottom: 32px; }
      `}</style>
    </div>
  );
}
