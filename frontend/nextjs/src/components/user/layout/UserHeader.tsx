'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import Logo from '@/components/Logo';

export default function UserHeader() {
  const pathname = usePathname();

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-logo">
          <Link href="/user">
            <Logo />
          </Link>
        </div>

        <div className="header-location">
          <div className="location-label">
            <MapPin size={14} />
            <span>Home</span>
            <ChevronDown size={14} />
          </div>
          <div className="location-detail">
            402, Skyline Residency, Koramangala...
          </div>
        </div>

        <button className="header-search-btn">
          <Search size={22} />
        </button>
      </div>

      <style jsx>{`
        .header {
          sticky;
          top: 0;
          z-index: 40;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-light);
          box-shadow: var(--shadow-sm);
          position: sticky;
        }
        .header-inner {
          max-width: 450px;
          margin: 0 auto;
          padding: 0 16px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .header-logo {
          display: flex;
          align-items: center;
        }
        .header-location {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          cursor: pointer;
          overflow: hidden;
        }
        .location-label {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--primary);
          font-weight: 800;
          font-size: 14px;
          letter-spacing: -0.3px;
        }
        .location-label span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .location-detail {
          font-size: 10px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }
        .header-search-btn {
          padding: 8px;
          color: var(--text-main);
          border-radius: 50%;
        }
        .header-search-btn:hover {
          background: var(--bg-muted);
        }
      `}</style>
    </header>
  );
}
