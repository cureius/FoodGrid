'use client';

import { useQuery } from '@tanstack/react-query';
import { getMenuItems, getMenuCategories, getOutlet } from '@/lib/api/customer';
import { useCartStore } from '@/stores/cart';
import { Star, Clock, Info, Search, Share2, Heart } from 'lucide-react';
import DishCard from '@/components/user/menu/DishCard';
import { useState, useMemo, useEffect, useRef } from 'react';

export default function RestaurantLanding() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [vegOnly, setVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const categoryNavRef = useRef<HTMLDivElement>(null);
  
  const outletId = '3a100b7d-4f55-42b1-849e-8fde1283cadf'; 

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

  const setStoreOutlet = useCartStore((state) => state.setOutlet);
  useEffect(() => {
    setStoreOutlet(outletId);
  }, [outletId, setStoreOutlet]);

  if (catLoading || itemsLoading || outletLoading) {
    return (
      <div className="loading-container">
        <div className="skeleton-banner" />
        <div className="skeleton-title" />
        <div className="skeleton-items">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
        <style jsx>{`
          .loading-container { padding: 16px; }
          .skeleton-banner { height: 180px; background: var(--bg-muted); border-radius: 16px; margin-bottom: 16px; animation: pulse 1.5s infinite; }
          .skeleton-title { height: 32px; width: 60%; background: var(--bg-muted); border-radius: 8px; margin-bottom: 24px; animation: pulse 1.5s infinite; }
          .skeleton-card { height: 120px; background: var(--bg-muted); border-radius: 12px; margin-bottom: 16px; animation: pulse 1.5s infinite; }
          @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="landing-page">
      {/* Restaurant Info Section */}
      <section className="restaurant-header">
        <div className="header-top">
          <div className="header-info">
            <h1 className="restaurant-name">{outlet?.name || 'Burger House'}</h1>
            <p className="restaurant-cuisines">Burgers • American • Fast Food</p>
            <p className="restaurant-address">Koramangala 4th Block, Bangalore</p>
          </div>
          <div className="header-actions">
            <button className="icon-btn"><Share2 size={18} /></button>
            <button className="icon-btn heart"><Heart size={18} /></button>
          </div>
        </div>

        <div className="info-badges no-scrollbar">
          <div className="badge success">
            <Star size={14} fill="currentColor" />
            <span>4.2 (1k+ reviews)</span>
          </div>
          <div className="badge primary">
            <Clock size={14} />
            <span>25-30 mins</span>
          </div>
          <div className="badge secondary">
            <Info size={14} />
            <span>Free delivery on ₹500+</span>
          </div>
        </div>
      </section>

      {/* Sticky Filters & Nav */}
      <div className="sticky-filters">
        <div className="filters-row">
          <div className="search-box">
            <Search className="search-icon" size={16} />
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
            Veg Only
          </button>
        </div>

        <div 
          ref={categoryNavRef}
          className="category-nav no-scrollbar"
        >
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

      {/* Menu List */}
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

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon-wrap">
            <Search className="empty-icon" size={32} />
          </div>
          <h3 className="empty-title">No matches found</h3>
          <p className="empty-text">We couldn't find any dishes matching your filters. Try search for something else!</p>
        </div>
      )}

      <style jsx>{`
        .landing-page { padding-bottom: 96px; }
        .restaurant-header { padding: 24px 16px 16px; }
        .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .restaurant-name { font-size: 24px; font-weight: 800; margin-bottom: 4px; color: var(--navy); }
        .restaurant-cuisines { color: var(--text-muted); font-size: 14px; font-weight: 600; }
        .restaurant-address { color: var(--text-light); font-size: 12px; margin-top: 4px; font-weight: 500; }
        .header-actions { display: flex; gap: 8px; }
        .icon-btn { width: 36px; height: 36px; background: white; border: 1px solid var(--border-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm); cursor: pointer; }
        .icon-btn.heart { color: var(--danger); }
        
        .info-badges { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
        .badge { flex-shrink: 0; display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; border: 1px solid transparent; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge.success { background: var(--success-light); color: var(--success); border-color: rgba(16, 185, 129, 0.1); }
        .badge.primary { background: var(--primary-light); color: var(--primary); border-color: var(--primary-border); }
        .badge.secondary { background: var(--secondary-light); color: var(--secondary); border-color: rgba(246, 155, 66, 0.1); }

        .sticky-filters { position: sticky; top: 64px; z-index: 30; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-light); padding-bottom: 8px; }
        .filters-row { padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
        .search-box { position: relative; flex: 1; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-light); }
        .search-input { width: 100%; height: 40px; background: var(--bg-muted); border: 2px solid transparent; border-radius: 12px; padding: 0 12px 0 36px; font-size: 14px; font-weight: 600; outline: none; transition: var(--transition-fast); }
        .search-input:focus { background: white; border-color: var(--primary-border); box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        
        .veg-toggle { display: flex; align-items: center; gap: 6px; padding: 0 12px; height: 40px; border-radius: 12px; border: 2px solid var(--border-light); font-size: 11px; font-weight: 800; color: var(--text-muted); background: white; transition: var(--transition-fast); text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; }
        .veg-toggle.active { background: var(--success); border-color: var(--success); color: white; }
        .veg-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); transition: var(--transition-fast); }
        .veg-toggle.active .veg-dot { background: white; }

        .category-nav { display: flex; gap: 12px; overflow-x: auto; padding: 4px 16px 8px; scroll-behavior: smooth; }
        .cat-btn { flex-shrink: 0; padding: 8px 16px; border-radius: 999px; font-size: 11px; font-weight: 800; background: var(--bg-muted); color: var(--text-muted); transition: var(--transition-fast); text-transform: uppercase; letter-spacing: 0.8px; cursor: pointer; }
        .cat-btn.active { background: var(--navy); color: white; box-shadow: var(--shadow-md); }

        .menu-list { padding: 24px 16px; }
        .menu-section { scroll-margin-top: 160px; margin-bottom: 32px; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .section-title { font-size: 20px; font-weight: 800; color: var(--navy); }
        .section-count { font-size: 10px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px; }
        .section-items { display: flex; flex-direction: column; }

        .empty-state { padding: 80px 32px; text-align: center; }
        .empty-icon-wrap { width: 80px; height: 80px; background: var(--bg-muted); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .empty-icon { color: var(--text-light); }
        .empty-title { font-size: 18px; font-weight: 800; margin-bottom: 8px; color: var(--navy); }
        .empty-text { color: var(--text-muted); font-size: 14px; line-height: 1.5; font-weight: 500; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
