'use client';

import Link from 'next/link';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import Logo from '@/components/Logo';

export default function UserHeader() {
  return (
    <header className="user-header">
      <div className="header-container">
        <div className="logo-section">
          <Link href="/user">
            <Logo />
          </Link>
        </div>

        <div className="address-section">
          <div className="address-label">
            <MapPin size={14} />
            <span className="truncate">Home</span>
            <ChevronDown size={14} />
          </div>
          <div className="address-text">
            Koramangala 4th Block...
          </div>
        </div>

        <button className="search-btn">
          <Search size={22} strokeWidth={2.5} />
        </button>
      </div>

      <style jsx>{`
        .user-header {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-light);
          height: 64px;
        }
        .header-container {
          max-width: 450px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 16px;
        }
        .logo-section { display: flex; align-items: center; }
        
        .address-section { flex: 1; min-width: 0; display: flex; flex-direction: column; cursor: pointer; padding: 4px 0; }
        .address-label { display: flex; align-items: center; gap: 4px; color: var(--primary); font-weight: 800; font-size: 13px; }
        .address-text { font-size: 10px; color: var(--text-light); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }

        .search-btn { padding: 8px; color: var(--navy); border-radius: 50%; transition: var(--transition-fast); }
        .search-btn:hover { background: var(--bg-muted); }
      `}</style>
    </header>
  );
}
