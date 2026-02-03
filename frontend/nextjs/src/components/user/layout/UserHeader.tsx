'use client';

import Link from 'next/link';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import Logo from '@/components/Logo';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

import { useParams } from 'next/navigation';

export default function UserHeader() {
  const params = useParams();
  const outletId = params?.outletId as string;
  const homeLink = outletId ? `/user/${outletId}` : '/user/outlets';

  return (
    <header className="user-header">
      <div className="header-container">
        <div className="logo-section">
          <Link href={homeLink}>
            <Logo />
          </Link>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <ThemeSwitcher />
        </div>
      </div>

      <style jsx>{`
        .user-header {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(var(--bg-surface-rgb), 0.85);
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

        .search-btn { padding: 8px; color: var(--text-main); border-radius: 50%; transition: var(--transition-fast); }
        .search-btn:hover { background: var(--bg-muted); }
      `}</style>
    </header>
  );
}
