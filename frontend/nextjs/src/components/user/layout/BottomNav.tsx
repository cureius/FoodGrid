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
    { label: 'Search', icon: Search, href: '/user/search' },
    { label: 'Orders', icon: ShoppingBag, href: '/user/orders' },
    { label: 'Account', icon: User, href: '/user/account' },
  ];

  return (
    <nav className="bottom-nav">
      <div className="nav-container">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <div className="icon-wrap">
                <Icon size={22} strokeWidth={isActive ? 3 : 2} />
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
        .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; background: white; border-top: 1px solid var(--border-light); height: 64px; box-shadow: 0 -4px 12px rgba(0,0,0,0.04); padding-bottom: env(safe-area-inset-bottom); }
        .nav-container { max-width: 450px; margin: 0 auto; display: flex; height: 100%; }
        
        .nav-link { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: var(--text-light); transition: var(--transition-fast); }
        .nav-link.active { color: var(--primary); }
        
        .icon-wrap { position: relative; }
        .badge { position: absolute; -top: 6px; -right: -8px; background: var(--secondary); color: white; font-size: 9px; font-weight: 900; height: 16px; min-width: 16px; display: flex; align-items: center; justify-content: center; border-radius: 999px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        
        .label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
      `}</style>
    </nav>
  );
}
