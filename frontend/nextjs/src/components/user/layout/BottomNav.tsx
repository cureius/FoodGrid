'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '@/stores/cart';

export default function BottomNav() {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.itemCount);

  const navItems = [
    { label: 'Home', icon: Home, href: '/user' },
    { label: 'Search', icon: Search, href: '/user/menu?search=true' },
    { label: 'Orders', icon: ShoppingBag, href: '/user/orders' },
    { label: 'Account', icon: User, href: '/user/account' },
  ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="icon-wrapper">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.label === 'Orders' && itemCount > 0 && (
                  <span className="badge">{itemCount}</span>
                )}
              </div>
              <span className="label">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: white;
          border-top: 1px solid var(--border-light);
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
          height: 64px;
          padding-bottom: env(safe-area-inset-bottom);
        }
        .bottom-nav-inner {
          max-width: 450px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-around;
          height: 100%;
        }
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          gap: 4px;
          text-decoration: none;
          color: var(--text-light);
          transition: var(--transition-fast);
        }
        .nav-item:hover {
          color: var(--text-muted);
        }
        .nav-item.active {
          color: var(--primary);
        }
        .icon-wrapper {
          position: relative;
          display: flex;
        }
        .label {
          font-size: 10px;
          font-weight: 600;
          line-height: 1;
        }
        .badge {
          position: absolute;
          top: -4px;
          right: -8px;
          background: var(--secondary);
          color: white;
          font-size: 9px;
          font-weight: 800;
          height: 16px;
          min-width: 16px;
          padding: 0 4px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        }
      `}</style>
    </nav>
  );
}
