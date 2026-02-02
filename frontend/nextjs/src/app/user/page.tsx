'use client';

import { useQuery } from '@tanstack/react-query';
import { getMenuItems, getMenuCategories, getOutlet, listOutlets, Outlet } from '@/lib/api/customer';
import { useCartStore } from '@/stores/cart';
import { Star, Clock, Info, Search, Share2, Heart, MapPin, ChevronRight, Store, ChevronLeft } from 'lucide-react';
import DishCard from '@/components/user/menu/DishCard';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';


// ─────────────────────────────────────────────────────────────
// Sub-component: Restaurant Landing (Menu View)
// ─────────────────────────────────────────────────────────────

function RestaurantView({ outletId, onBack }: { outletId: string; onBack: () => void }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [vegOnly, setVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const categoryNavRef = useRef<HTMLDivElement>(null);

  const { data: outlet, isLoading: outletLoading } = useQuery({
    queryKey: ['outlet', outletId],
    queryFn: () => getOutlet(outletId),
  });

  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ['categories', outletId],
    queryFn: () => getMenuCategories(outletId),
  });

  const { data: menuItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['menu-items', outletId],
    queryFn: () => getMenuItems(outletId, { status: 'ACTIVE' }),
  });

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter(item => {
      const matchesVeg = !vegOnly || item.isVeg;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.categoryName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesVeg && matchesSearch;
    });
  }, [menuItems, vegOnly, searchQuery]);

  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, typeof menuItems> = {};
    if (!filteredItems) return grouped;
    
    filteredItems.forEach(item => {
      const catName = item.categoryName || 'Others';
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName]!.push(item);
    });
    
    return grouped;
  }, [filteredItems]);

  if (catLoading || itemsLoading || outletLoading) {
    return (
      <div className="loading-container">
        <div className="skeleton-banner" />
        <div className="skeleton-title" />
        {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
        <style jsx>{`
            .loading-container { padding: 16px; }
            .skeleton-banner { height: 180px; background: var(--bg-muted); border-radius: 16px; margin-bottom: 24px; animation: pulse 1.5s infinite; }
            .skeleton-title { height: 32px; width: 60%; background: var(--bg-muted); border-radius: 8px; margin-bottom: 24px; animation: pulse 1.5s infinite; }
            .skeleton-card { height: 120px; background: var(--bg-muted); border-radius: 12px; margin-bottom: 16px; animation: pulse 1.5s infinite; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="landing-page">
      {/* Restaurant Header */}
      <section className="restaurant-header">
        <div className="header-nav">
            <button onClick={onBack} className="back-btn">
                <ChevronLeft size={24} />
            </button>
            <div className="header-actions">
                <button className="icon-btn"><Share2 size={18} /></button>
                <button className="icon-btn heart"><Heart size={18} /></button>
            </div>
        </div>

        <div className="header-info">
            <h1 className="restaurant-name">{outlet?.name || 'Restaurant'}</h1>
            <p className="restaurant-cuisines">Indian • Chinese • Fast Food</p>
            <div className="info-badges no-scrollbar">
                <div className="badge success">
                    <Star size={12} fill="currentColor" />
                    <span>4.2 (1k+)</span>
                </div>
                <div className="badge primary">
                    <Clock size={12} />
                    <span>10-15 mins</span>
                </div>
                <div className="badge info">
                    <Info size={12} />
                    <span>Offers</span>
                </div>
            </div>
        </div>
      </section>

      {/* Sticky Filters & Nav */}
      <div className="sticky-filters">
        <div className="filters-row">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search dishes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button 
            onClick={() => setVegOnly(!vegOnly)}
            className={`veg-toggle ${vegOnly ? 'active' : ''}`}
          >
            <span className="veg-dot" />
            Veg
          </button>
        </div>

        <div ref={categoryNavRef} className="category-nav no-scrollbar">
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.name);
                document.getElementById(`category-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`cat-btn ${activeCategory === cat.name ? 'active' : ''}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="menu-list">
        {Object.entries(itemsByCategory).map(([catName, items]) => {
          const catId = categories?.find(c => c.name === catName)?.id;
          return (
            <section key={catName} id={`category-${catId}`} className="menu-section">
              <div className="section-header">
                <h2 className="section-title">{catName}</h2>
                <span className="section-count">{items?.length} Items</span>
              </div>
              <div className="section-items">
                {items?.map(item => (
                  <DishCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <style jsx>{`
        .landing-page { padding-bottom: 96px;  }
        .restaurant-header { padding: 16px 16px 24px; border-bottom: 1px solid var(--border-light); }
        .header-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .back-btn { padding: 4px; margin-left: -8px; color: var(--navy); }
        .header-actions { display: flex; gap: 8px; }
        .icon-btn { width: 36px; height: 36px; background: white; border: 1px solid var(--border-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm); cursor: pointer; }
        .icon-btn.heart { color: var(--danger); }
        
        .restaurant-name { font-size: 26px; font-weight: 900; color: var(--navy); margin-bottom: 4px; letter-spacing: -0.5px; }
        .restaurant-cuisines { font-size: 13px; color: var(--text-muted); font-weight: 600; margin-bottom: 16px; }

        .info-badges { display: flex; gap: 10px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .badge { flex-shrink: 0; display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge.success { background: var(--success-light); color: var(--success); }
        .badge.primary { background: var(--primary-light); color: var(--primary); }
        .badge.info { background: var(--bg-muted); color: var(--text-muted); }

        .sticky-filters { position: sticky; top: 0; z-index: 30; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border-light); }
        .filters-row { padding: 12px 16px; display: flex; gap: 12px; }
        .search-box { position: relative; flex: 1; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-light); }
        .search-input { width: 100%; height: 40px; background: var(--bg-muted); border: 2px solid transparent; border-radius: 12px; padding: 0 12px 0 36px; font-size: 14px; font-weight: 600; outline: none; transition: 0.2s; }
        .search-input:focus { background: white; border-color: var(--primary-border); }
        
        .veg-toggle { display: flex; align-items: center; gap: 6px; padding: 0 12px; height: 40px; border-radius: 12px; border: 2px solid var(--border-light); font-size: 11px; font-weight: 800; color: var(--text-muted); background: white; cursor: pointer; }
        .veg-toggle.active { background: var(--success); border-color: var(--success); color: white; }
        .veg-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); }
        .veg-toggle.active .veg-dot { background: white; }

        .category-nav { display: flex; gap: 12px; overflow-x: auto; padding: 0 16px 12px; }
        .cat-btn { flex-shrink: 0; padding: 8px 16px; border-radius: 999px; font-size: 11px; font-weight: 800; background: var(--bg-muted); color: var(--text-muted); text-transform: uppercase; cursor: pointer; }
        .cat-btn.active { background: var(--navy); color: white; }

        .menu-list { padding: 24px 16px; }
        .menu-section { scroll-margin-top: 120px; margin-bottom: 32px; }
        .section-title { font-size: 20px; font-weight: 800; color: var(--navy); margin-bottom: 16px; }
        .section-count { font-size: 10px; font-weight: 800; color: var(--text-light); text-transform: uppercase; margin-left: 8px; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────

export default function UserHomePage() {
  const router = useRouter();
  const { outletId } = useCartStore();

  useEffect(() => {
    if (!outletId) {
      router.replace('/user/outlets');
    }
  }, [outletId, router]);

  if (!outletId) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
          key="landing"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
      >
          <RestaurantView outletId={outletId} onBack={() => router.push('/user/outlets')} />
      </motion.div>
    </AnimatePresence>
  );
}
