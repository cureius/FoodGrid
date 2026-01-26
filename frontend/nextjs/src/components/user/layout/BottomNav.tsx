'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '@/stores/cart';

export default function BottomNav() {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.itemCount);

  const navItems = [
    { label: 'Home', icon: Home, href: '/user' },
    { label: 'Cart', icon: ShoppingCart, href: '/user/cart' },
    { label: 'Orders', icon: ShoppingBag, href: '/user/orders' },
    { label: 'Account', icon: User, href: '/user/account' },
  ];

  return (
    <nav className="bottom-nav">
      <div className="nav-wrapper">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="icon-box">
                <Icon size={22} />
                {item.label === 'Cart' && itemCount > 0 && (
                  <span className="badge">{itemCount}</span>
                )}
              </div>
              {isActive && <span className="label">{item.label}</span>}
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
          background: #fff;
          padding-bottom: env(safe-area-inset-bottom);
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.08);
          z-index: 50;
        }

        .nav-wrapper {
          max-width: 480px;
          margin: 0 auto;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-around;
        }

        .nav-item {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #9ca3af;
          transition: all 0.25s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .nav-item.active {
          color: #e11d48;
        }

        .icon-box {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.25s ease, transform 0.25s ease;
        }

        .nav-item.active .icon-box {
          background: rgba(225, 29, 72, 0.12);
          transform: translateY(-2px);
        }

        .label {
          margin-top: 2px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        .badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #e11d48;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          height: 16px;
          min-width: 16px;
          padding: 0 4px;
          border-radius: 999px;
          border: 2px solid #fff;
          line-height: 1;
        }
      `}</style>
    </nav>
  );
}
