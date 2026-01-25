'use client';

import { ChevronLeft, User, MapPin, CreditCard, Bell, Shield, LogOut, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const router = useRouter();

  interface AccountMenuItem {
    label: string;
    icon: any;
    value?: string;
  }

  interface AccountMenuGroup {
    title: string;
    items: AccountMenuItem[];
  }

  const menuGroups: AccountMenuGroup[] = [
    {
      title: 'My Account',
      items: [
        { label: 'Profile Information', icon: User, value: 'Sourajit' },
        { label: 'Saved Addresses', icon: MapPin, value: '2 Saved' },
        { label: 'Payment Methods', icon: CreditCard, value: 'UPI, Visa' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { label: 'Notifications', icon: Bell },
        { label: 'Privacy & Security', icon: Shield },
      ]
    }
  ];

  return (
    <div className="account-page">
      <header className="account-header">
        <button onClick={() => router.push('/user')} className="back-btn">
          <ChevronLeft size={24} />
        </button>
        <h1 className="header-title">My Profile</h1>
      </header>

      <main className="account-main">
        {/* Profile Card */}
        <div className="profile-card">
            <div className="profile-header">
                <div className="avatar-wrap">
                    <User size={32} />
                </div>
                <div className="profile-info">
                    <h2 className="profile-name">Sourajit</h2>
                    <p className="profile-meta">sourajit@example.com • 9876543210</p>
                </div>
            </div>

            <div className="profile-stats">
                <div className="stat-box">
                    <span className="stat-label">Total Orders</span>
                    <span className="stat-val">12</span>
                </div>
                <div className="stat-box">
                    <span className="stat-label">Member Since</span>
                    <span className="stat-val">2024</span>
                </div>
            </div>
        </div>

        {/* Menu Groups */}
        <div className="menu-groups">
            {menuGroups.map(group => (
                <div key={group.title} className="menu-group">
                    <h3 className="group-title">{group.title}</h3>
                    <div className="group-list">
                        {group.items.map(item => (
                            <button 
                                key={item.label}
                                className="menu-item"
                            >
                                <div className="item-icon-wrap">
                                    <item.icon size={18} />
                                </div>
                                <span className="item-label">{item.label}</span>
                                {item.value && <span className="item-val">{item.value}</span>}
                                <ChevronRight size={16} className="arrow-icon" />
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>

        {/* Logout */}
        <button className="logout-btn">
            <LogOut size={20} />
            LOG OUT
        </button>

        <p className="version-info">FoodGrid Customer App v1.0.4</p>
      </main>

      <style jsx>{`
        .account-page { background: var(--bg-app); min-height: 100vh; padding-bottom: 96px; }
        .account-header { position: sticky; top: 0; z-index: 40; background: white; border-bottom: 1px solid var(--border-light); height: 64px; display: flex; align-items: center; padding: 0 16px; gap: 16px; }
        .back-btn { padding: 4px; margin-left: -4px; color: var(--navy); }
        .header-title { font-size: 18px; font-weight: 800; color: var(--navy); }

        .account-main { padding: 16px; display: flex; flex-direction: column; gap: 24px; }
        
        .profile-card { background: white; border-radius: 32px; padding: 24px; border: 1px solid var(--border-light); box-shadow: var(--shadow-sm); }
        .profile-header { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }
        .avatar-wrap { width: 64px; height: 64px; background: var(--primary-light); border-radius: 20px; border: 2px solid var(--primary-border); color: var(--primary); display: flex; align-items: center; justify-content: center; }
        .profile-name { font-size: 20px; font-weight: 800; }
        .profile-meta { font-size: 12px; color: var(--text-muted); font-weight: 600; margin-top: 2px; }

        .profile-stats { display: flex; gap: 12px; }
        .stat-box { flex: 1; background: var(--bg-muted); border-radius: 16px; padding: 12px; text-align: center; }
        .stat-label { display: block; font-size: 9px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .stat-val { font-size: 18px; font-weight: 800; color: var(--navy); }

        .menu-groups { display: flex; flex-direction: column; gap: 24px; }
        .menu-group { display: flex; flex-direction: column; gap: 12px; }
        .group-title { font-size: 10px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 2px; padding-left: 8px; }
        .group-list { background: white; border-radius: 24px; border: 1px solid var(--border-light); overflow: hidden; box-shadow: var(--shadow-sm); }
        
        .menu-item { width: 100%; height: 56px; padding: 0 16px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid var(--border-light); transition: var(--transition-fast); text-align: left; }
        .menu-item:last-child { border-bottom: none; }
        .menu-item:hover { background: var(--bg-muted); }
        .item-icon-wrap { width: 32px; height: 32px; background: var(--bg-muted); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); transition: var(--transition-fast); }
        .menu-item:hover .item-icon-wrap { color: var(--primary); background: var(--primary-light); }
        .item-label { flex: 1; font-size: 14px; font-weight: 700; color: var(--navy); }
        .item-val { font-size: 12px; font-weight: 700; color: var(--text-light); }
        .arrow-icon { color: var(--border-medium); }

        .logout-btn { width: 100%; height: 56px; border: 2px dashed rgba(239, 68, 68, 0.3); border-radius: 20px; color: var(--danger); font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 12px; transition: var(--transition-fast); margin-top: 16px; }
        .logout-btn:hover { background: rgba(239, 68, 68, 0.05); }
        .logout-btn:active { transform: scale(0.98); }

        .version-info { text-align: center; font-size: 10px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 2px; margin-top: 32px; }
      `}</style>
    </div>
  );
}
