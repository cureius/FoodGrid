'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import styles from './Inventory.module.css';

type StockLevel = 'high' | 'medium' | 'low' | 'empty';
type DishStatus = 'available' | 'not-available';

type Dish = {
  id: string;
  name: string;
  category: 'Soup' | 'Noodle' | 'Rice' | 'Dessert' | 'Drink';
  canBeServed: number;
  stockLevel: StockLevel;
  status: DishStatus;
  image: string;
  ingredients: {
    name: string;
    amount: string;
    stockLevel: StockLevel;
  }[];
};

type IngredientItem = {
  id: string;
  name: string;
  category: 'Fresh Produce' | 'Meat & Poultry' | 'Seafood' | 'Dairy & Eggs' | 'Dry Goods & Grains';
  stockText: string;
  stockLevel: StockLevel;
  supplier: string;
  status: 'Need Request' | 'Normal' | 'Good';
  image: string;
};

const levelText: Record<StockLevel, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  empty: 'Empty',
};

function levelDotClass(level: StockLevel) {
  if (level === 'high') return styles.dotHigh;
  if (level === 'medium') return styles.dotMedium;
  if (level === 'low') return styles.dotLow;
  return styles.dotEmpty;
}

function levelTextClass(level: StockLevel) {
  if (level === 'high') return styles.levelHigh;
  if (level === 'medium') return styles.levelMedium;
  if (level === 'low') return styles.levelLow;
  return styles.levelEmpty;
}

function statusPillClass(status: IngredientItem['status']) {
  if (status === 'Need Request') return `${styles.statusPill} ${styles.statusNeed}`;
  if (status === 'Normal') return `${styles.statusPill} ${styles.statusNormal}`;
  return `${styles.statusPill} ${styles.statusGood}`;
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 18C14.6421 18 18 14.6421 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
        fill="currentColor"
      />
      <path
        d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z"
        fill="currentColor"
      />
      <path
        d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z"
        fill="currentColor"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const dishCategories: Dish['category'][] = ['Soup', 'Noodle', 'Rice', 'Dessert', 'Drink'];

const dishesSeed: Dish[] = [
  {
    id: 'd1',
    name: 'Snapper in Spicy Sour Sauce',
    category: 'Soup',
    canBeServed: 30,
    stockLevel: 'high',
    status: 'available',
    image:
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=60',
    ingredients: [
      { name: 'Snapper fillet', amount: '500gr', stockLevel: 'high' },
      { name: 'Garlic', amount: '3 cloves (minced)', stockLevel: 'high' },
      { name: 'Ginger', amount: '1 inch (julienned)', stockLevel: 'low' },
      { name: 'Sweet chili sauce', amount: '2 tablespoons', stockLevel: 'medium' },
    ],
  },
  {
    id: 'd2',
    name: 'Seafood Fried Noodles',
    category: 'Noodle',
    canBeServed: 30,
    stockLevel: 'high',
    status: 'available',
    image:
      'https://images.unsplash.com/photo-1604908812509-a72653a4c678?auto=format&fit=crop&w=1200&q=60',
    ingredients: [
      { name: 'Noodles', amount: '200gr', stockLevel: 'high' },
      { name: 'Shrimp', amount: '120gr', stockLevel: 'medium' },
      { name: 'Soy sauce', amount: '1 tbsp', stockLevel: 'high' },
      { name: 'Garlic', amount: '2 cloves', stockLevel: 'high' },
    ],
  },
  {
    id: 'd3',
    name: 'Sour Meat Soup',
    category: 'Soup',
    canBeServed: 4,
    stockLevel: 'low',
    status: 'available',
    image:
      'https://images.unsplash.com/photo-1543353071-087092ec393a?auto=format&fit=crop&w=1200&q=60',
    ingredients: [
      { name: 'Beef', amount: '250gr', stockLevel: 'medium' },
      { name: 'Tomato', amount: '2 pcs', stockLevel: 'low' },
      { name: 'Chili', amount: '1 pc', stockLevel: 'low' },
      { name: 'Salt', amount: '1 tsp', stockLevel: 'high' },
    ],
  },
  {
    id: 'd4',
    name: 'Chicken Fried Rice',
    category: 'Rice',
    canBeServed: 1,
    stockLevel: 'low',
    status: 'available',
    image:
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1200&q=60',
    ingredients: [
      { name: 'Rice', amount: '250gr', stockLevel: 'high' },
      { name: 'Chicken', amount: '120gr', stockLevel: 'high' },
      { name: 'Egg', amount: '1 pc', stockLevel: 'medium' },
      { name: 'Green onion', amount: '1 stalk', stockLevel: 'low' },
    ],
  },
  {
    id: 'd5',
    name: 'Seafood Fried Rice',
    category: 'Rice',
    canBeServed: 4,
    stockLevel: 'low',
    status: 'available',
    image:
      'https://images.unsplash.com/photo-1604908177225-7b3928b9745e?auto=format&fit=crop&w=1200&q=60',
    ingredients: [
      { name: 'Rice', amount: '250gr', stockLevel: 'high' },
      { name: 'Shrimp', amount: '80gr', stockLevel: 'low' },
      { name: 'Squid', amount: '60gr', stockLevel: 'medium' },
      { name: 'Garlic', amount: '2 cloves', stockLevel: 'high' },
    ],
  },
  {
    id: 'd6',
    name: 'Soto Mie Bogor',
    category: 'Soup',
    canBeServed: 15,
    stockLevel: 'medium',
    status: 'available',
    image:
      'https://images.unsplash.com/photo-1604908554171-2a673e7eac03?auto=format&fit=crop&w=1200&q=60',
    ingredients: [
      { name: 'Noodles', amount: '200gr', stockLevel: 'high' },
      { name: 'Chicken', amount: '120gr', stockLevel: 'medium' },
      { name: 'Cabbage', amount: '60gr', stockLevel: 'low' },
      { name: 'Broth', amount: '300ml', stockLevel: 'high' },
    ],
  },
];

const ingredientsSeed: IngredientItem[] = [
  {
    id: 'i1',
    name: 'Bok Choy',
    category: 'Fresh Produce',
    stockText: 'Stock: 1.5kg',
    stockLevel: 'low',
    supplier: 'GastroSupplies',
    status: 'Need Request',
    image:
      'https://images.unsplash.com/photo-1542587210-7b0b97f1b2c8?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'i2',
    name: 'Romaine Lettuce',
    category: 'Fresh Produce',
    stockText: 'Stock: 4.2kg',
    stockLevel: 'medium',
    supplier: 'Culinary Depot',
    status: 'Normal',
    image:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'i3',
    name: 'Chicken Breast',
    category: 'Meat & Poultry',
    stockText: 'Stock: 10kg',
    stockLevel: 'high',
    supplier: 'GastroSupplies',
    status: 'Good',
    image:
      'https://images.unsplash.com/photo-1604908554005-4a4d8b5b0b48?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'i4',
    name: 'Ground Beef',
    category: 'Meat & Poultry',
    stockText: 'Stock: 7kg',
    stockLevel: 'medium',
    supplier: 'Elite Ingredient Co.',
    status: 'Normal',
    image:
      'https://images.unsplash.com/photo-1603048297172-c92544798dff?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'i5',
    name: 'Salmon Fillet',
    category: 'Seafood',
    stockText: 'Stock: 1.8kg',
    stockLevel: 'low',
    supplier: 'Elite Ingredient Co.',
    status: 'Need Request',
    image:
      'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'i6',
    name: 'Black Tiger Shrimp',
    category: 'Seafood',
    stockText: 'Stock: 900g',
    stockLevel: 'low',
    supplier: 'Culinary Depot',
    status: 'Need Request',
    image:
      'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'i7',
    name: 'Large Brown Eggs',
    category: 'Dairy & Eggs',
    stockText: 'Stock: 8.4kg',
    stockLevel: 'high',
    supplier: 'Elite Ingredient Co.',
    status: 'Good',
    image:
      'https://images.unsplash.com/photo-1589927986089-35812386c631?auto=format&fit=crop&w=400&q=60',
  },
];

function countByStockLevel(level: StockLevel, items: { stockLevel: StockLevel }[]) {
  return items.filter((x) => x.stockLevel === level).length;
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'Menu' | 'Ingredients' | 'Request List'>('Menu');
  const [query, setQuery] = useState('');

  const [dishStatusFilter, setDishStatusFilter] = useState<'All' | 'Available' | 'Not Available'>('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'Low' | 'Medium' | 'High' | 'Empty'>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | Dish['category'] | IngredientItem['category']>('All');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addStep, setAddStep] = useState<1 | 2>(1);

  const [detailDish, setDetailDish] = useState<Dish | null>(null);

  const dishes = useMemo(() => dishesSeed, []);
  const ingredients = useMemo(() => ingredientsSeed, []);

  const counts = useMemo(() => {
    const totalStockAll = ingredients.length + dishes.length;
    const low = countByStockLevel('low', [...ingredients, ...dishes]);
    const medium = countByStockLevel('medium', [...ingredients, ...dishes]);
    const high = countByStockLevel('high', [...ingredients, ...dishes]);
    const empty = countByStockLevel('empty', [...ingredients, ...dishes]);

    const catCounts = {
      All: ingredients.length,
      'Fresh Produce': ingredients.filter((i) => i.category === 'Fresh Produce').length,
      'Meat & Poultry': ingredients.filter((i) => i.category === 'Meat & Poultry').length,
      Seafood: ingredients.filter((i) => i.category === 'Seafood').length,
      'Dairy & Eggs': ingredients.filter((i) => i.category === 'Dairy & Eggs').length,
      'Dry Goods & Grains': ingredients.filter((i) => i.category === 'Dry Goods & Grains').length,
    };

    const dishCatCounts = {
      All: dishes.length,
      Soup: dishes.filter((d) => d.category === 'Soup').length,
      Noodle: dishes.filter((d) => d.category === 'Noodle').length,
      Rice: dishes.filter((d) => d.category === 'Rice').length,
      Dessert: dishes.filter((d) => d.category === 'Dessert').length,
      Drink: dishes.filter((d) => d.category === 'Drink').length,
    };

    return { totalStockAll, low, medium, high, empty, catCounts, dishCatCounts };
  }, [dishes, ingredients]);

  const filteredDishes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes
      .filter((d) => {
        if (!q) return true;
        return d.name.toLowerCase().includes(q);
      })
      .filter((d) => {
        if (dishStatusFilter === 'All') return true;
        if (dishStatusFilter === 'Available') return d.status === 'available';
        return d.status === 'not-available';
      })
      .filter((d) => {
        if (categoryFilter === 'All') return true;
        return d.category === categoryFilter;
      })
      .filter((d) => {
        if (stockFilter === 'All') return true;
        return d.stockLevel === stockFilter.toLowerCase();
      });
  }, [categoryFilter, dishStatusFilter, dishes, query, stockFilter]);

  const filteredIngredients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ingredients
      .filter((i) => {
        if (!q) return true;
        return i.name.toLowerCase().includes(q);
      })
      .filter((i) => {
        if (categoryFilter === 'All') return true;
        return i.category === categoryFilter;
      })
      .filter((i) => {
        if (stockFilter === 'All') return true;
        return i.stockLevel === stockFilter.toLowerCase();
      });
  }, [categoryFilter, ingredients, query, stockFilter]);

  const headerTitle = activeTab === 'Ingredients' ? 'Search Ingredients Name Here' : 'Search Dish Name Here';
  const addLabel = activeTab === 'Ingredients' ? 'Add New Ingredients' : 'Add New Dish';

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div className={styles.titlePill}>
          <span aria-hidden="true">⌂</span>
          <span>Inventory</span>
        </div>

        <div className={styles.headerMid}>
          <div className={styles.tabs}>
            {(['Menu', 'Ingredients', 'Request List'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`${styles.tab} ${t === activeTab ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.searchWrap}>
            <SearchIcon />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={headerTitle} />
          </div>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => {
              if (activeTab === 'Request List') return;
              setIsAddOpen(true);
              setAddStep(1);
            }}
            disabled={activeTab === 'Request List'}
          >
            <PlusIcon />
            {addLabel}
          </button>
        </div>
      </div>

      <div className={styles.shell}>
        <aside className={styles.filterCard}>
          <div className={styles.filterTitle}>Filter</div>

          {activeTab === 'Menu' && (
            <div className={styles.filterSection}>
              <div className={styles.filterLabel}>DISHES STATUS</div>
              <div className={styles.chipsWrap}>
                <button
                  type="button"
                  className={`${styles.chip} ${dishStatusFilter === 'All' ? styles.chipActive : ''}`}
                  onClick={() => setDishStatusFilter('All')}
                >
                  All <span className={styles.badgeCount}>{dishes.length}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.chip} ${dishStatusFilter === 'Available' ? styles.chipActive : ''}`}
                  onClick={() => setDishStatusFilter('Available')}
                >
                  Available <span className={styles.badgeCount}>{dishes.filter((d) => d.status === 'available').length}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.chip} ${dishStatusFilter === 'Not Available' ? styles.chipActive : ''}`}
                  onClick={() => setDishStatusFilter('Not Available')}
                >
                  Not Available <span className={styles.badgeCount}>{dishes.filter((d) => d.status === 'not-available').length}</span>
                </button>
              </div>
            </div>
          )}

          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>STOCK LEVEL</div>
            <div className={styles.chipsWrap}>
              {(
                [
                  { label: 'All', count: counts.totalStockAll },
                  { label: 'Low', count: counts.low },
                  { label: 'Medium', count: counts.medium },
                  { label: 'High', count: counts.high },
                  { label: 'Empty', count: counts.empty },
                ] as const
              ).map((x) => (
                <button
                  key={x.label}
                  type="button"
                  className={`${styles.chip} ${stockFilter === x.label ? styles.chipActive : ''}`}
                  onClick={() => setStockFilter(x.label)}
                >
                  {x.label} <span className={styles.badgeCount}>{x.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>CATEGORY</div>

            {activeTab === 'Menu' ? (
              <div className={styles.chipsWrap}>
                <button
                  type="button"
                  className={`${styles.chip} ${categoryFilter === 'All' ? styles.chipActive : ''}`}
                  onClick={() => setCategoryFilter('All')}
                >
                  All <span className={styles.badgeCount}>{counts.dishCatCounts.All}</span>
                </button>
                {dishCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`${styles.chip} ${categoryFilter === c ? styles.chipActive : ''}`}
                    onClick={() => setCategoryFilter(c)}
                  >
                    {c} <span className={styles.badgeCount}>{counts.dishCatCounts[c]}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.categoryList}>
                {(
                  [
                    { label: 'All', icon: '🧾' },
                    { label: 'Fresh Produce', icon: '🥬' },
                    { label: 'Meat & Poultry', icon: '🍗' },
                    { label: 'Seafood', icon: '🐟' },
                    { label: 'Dairy & Eggs', icon: '🥚' },
                    { label: 'Dry Goods & Grains', icon: '🍚' },
                  ] as const
                ).map((c) => {
                  const isActive = categoryFilter === c.label;
                  const count = counts.catCounts[c.label];
                  return (
                    <button
                      key={c.label}
                      type="button"
                      className={`${styles.categoryBtn} ${isActive ? styles.categoryBtnActive : ''}`}
                      onClick={() => setCategoryFilter(c.label)}
                    >
                      <span className={styles.categoryText}>
                        <span aria-hidden="true">{c.icon}</span>
                        <span>{c.label}</span>
                      </span>
                      <span className={styles.categoryCount}>{count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                setDishStatusFilter('All');
                setStockFilter('All');
                setCategoryFilter('All');
                setQuery('');
              }}
            >
              ↻ Reset Filter
            </button>
          </div>
        </aside>

        <section className={styles.contentCard}>
          <div className={styles.contentHeader}>
            <div className={styles.contentTitle}>
              {activeTab === 'Menu' ? 'Menu List' : activeTab === 'Ingredients' ? 'Ingredients List' : 'Request List'}
            </div>
          </div>

          {activeTab === 'Menu' && (
            <div className={styles.dishGrid}>
              {filteredDishes.map((d) => (
                <button key={d.id} type="button" className={styles.dishCard} onClick={() => setDetailDish(d)}>
                  <div className={styles.dishImageWrap}>
                    <Image className={styles.dishImg} src={d.image} alt={d.name} fill sizes="(max-width: 1100px) 50vw, 33vw" />
                    <div className={styles.availablePill}>
                      <span className={styles.availableDot} aria-hidden="true" />
                      <span>{d.status === 'available' ? 'Available' : 'Not Available'}</span>
                    </div>
                  </div>
                  <div className={styles.dishBody}>
                    <div className={styles.dishName}>{d.name}</div>
                    <div className={styles.dishCategory}>{d.category}</div>
                    <div className={styles.dishFooter}>
                      <div className={styles.canServe}>Can be served: {d.canBeServed}</div>
                      <div className={styles.stockInline}>
                        <span className={`${styles.dot} ${levelDotClass(d.stockLevel)}`} aria-hidden="true" />
                        <span className={`${styles.stockText} ${levelTextClass(d.stockLevel)}`}>{levelText[d.stockLevel]}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'Ingredients' && (
            <div className={styles.ingList}>
              {filteredIngredients.map((i) => (
                <div key={i.id} className={styles.ingRow}>
                  <div className={styles.ingLeft}>
                    {/* Use <img> here to avoid configuring remote image domains */}
                    <img className={styles.ingImg} src={i.image} alt={i.name} loading="lazy" />
                    <div style={{ minWidth: 0 }}>
                      <div className={styles.ingName}>{i.name}</div>
                      <div className={styles.ingMeta}>
                        {i.category} · {i.stockText} · <span className={levelTextClass(i.stockLevel)}>{levelText[i.stockLevel]}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className={styles.ingColLabel}>SUPPLIER</div>
                    <div className={styles.ingColValue}>{i.supplier}</div>
                  </div>

                  <div>
                    <div className={styles.ingColLabel}>STATUS</div>
                    <div className={statusPillClass(i.status)}>{i.status}</div>
                  </div>

                  <button type="button" className={styles.moreBtn} aria-label="More">
                    <MoreIcon />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Request List' && (
            <div style={{ padding: 16, color: 'rgba(109,120,139,0.95)' }}>
              Request List UI not implemented yet.
            </div>
          )}
        </section>
      </div>

      {isAddOpen && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={activeTab === 'Ingredients' ? 'Add New Ingredients' : 'Add New Dish'}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsAddOpen(false);
          }}
        >
          <div className={styles.modal}>
            <div className={styles.modalTop}>
              <div className={styles.modalTitle}>{activeTab === 'Ingredients' ? 'Add New Ingredients' : 'Add New Dish'}</div>
              <button type="button" className={styles.iconClose} onClick={() => setIsAddOpen(false)} aria-label="Close">
                <XIcon />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalSidebar}>
                <div className={`${styles.stepRow} ${addStep === 1 ? styles.stepRowActive : ''}`}>
                  <span className={`${styles.stepDot} ${addStep === 1 ? styles.stepDotActive : styles.stepDotDone}`}>1</span>
                  <span className={styles.stepText}>Dish Info</span>
                </div>
                <div className={`${styles.stepRow} ${addStep === 2 ? styles.stepRowActive : ''}`}>
                  <span className={`${styles.stepDot} ${addStep === 2 ? styles.stepDotActive : ''}`}>2</span>
                  <span className={styles.stepText}>Ingredients</span>
                </div>
              </div>

              <div className={styles.modalContent}>
                {addStep === 1 ? (
                  <>
                    <div className={styles.panelTitle}>Dish Information</div>
                    <div className={styles.formStack}>
                      <div className={styles.field}>
                        <div className={styles.label}>Dish Name</div>
                        <input className={styles.input} placeholder="Enter Dish Name" />
                      </div>
                      <div className={styles.field}>
                        <div className={styles.label}>Dish Category</div>
                        <div className={styles.pillsRow}>
                          {dishCategories.map((c) => (
                            <button key={c} type="button" className={styles.categoryPill}>
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <div className={styles.label}>Dish Description</div>
                        <textarea className={styles.textarea} placeholder="Enter Dish Name" />
                      </div>
                      <div className={styles.field}>
                        <div className={styles.label}>Price</div>
                        <div className={styles.priceWrap}>
                          <div className={styles.pricePrefix}>$</div>
                          <input className={styles.priceInput} placeholder="" inputMode="decimal" />
                        </div>
                      </div>
                    </div>

                    <div className={styles.modalFooter}>
                      <button type="button" className={styles.primaryBtn} onClick={() => setAddStep(2)}>
                        Save and Next
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.panelTitle}>Ingredients</div>
                    <div className={styles.ingredientsGrid}>
                      <div className={styles.field}>
                        <div className={styles.label}>Ingredients Name</div>
                        <button type="button" className={styles.selectBtn}>
                          <span>Select Ingredients</span>
                          <ChevronDown />
                        </button>
                      </div>
                      <div className={styles.field}>
                        <div className={styles.label}>Quantity</div>
                        <input className={styles.input} />
                      </div>
                      <div className={styles.field}>
                        <div className={styles.label}>Unit</div>
                        <button type="button" className={styles.selectBtn}>
                          <span>Select Unit</span>
                          <ChevronDown />
                        </button>
                      </div>
                    </div>

                    <button type="button" className={styles.outlineBtn}>
                      <PlusIcon />
                      Add Ingredients
                    </button>

                    <div className={styles.modalFooter}>
                      <button type="button" className={styles.primaryBtn} onClick={() => setIsAddOpen(false)}>
                        Save and Submit
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {detailDish && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Detail Dish"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetailDish(null);
          }}
        >
          <div className={styles.detailModal}>
            <div className={styles.modalTop}>
              <div className={styles.modalTitle}>Detail Dish</div>
              <button type="button" className={styles.iconCloseDark} onClick={() => setDetailDish(null)} aria-label="Close">
                <XIcon />
              </button>
            </div>

            <div className={styles.detailBody}>
              <div className={styles.detailSectionTitle}>Dish</div>
              <div className={styles.detailDishRow}>
                {/* Use <img> to avoid configuring remote image domains */}
                <img className={styles.detailDishImg} src={detailDish.image} alt={detailDish.name} />
                <div>
                  <div className={styles.detailDishName}>{detailDish.name}</div>
                  <div className={styles.detailDishMeta}>
                    <span>{detailDish.category}</span>
                    <span>·</span>
                    <span>Can be served {detailDish.canBeServed}</span>
                    <span>·</span>
                    <span className={levelTextClass(detailDish.stockLevel)}>{levelText[detailDish.stockLevel]}</span>
                  </div>
                </div>
              </div>

              <div style={{ height: 16 }} />

              <div className={styles.detailSectionTitle}>Ingredients</div>
              <div className={styles.detailGrid}>
                {detailDish.ingredients.map((ing) => (
                  <div key={ing.name} className={styles.detailIngCard}>
                    <div className={styles.detailIngLeft}>
                      <div className={styles.detailIngAvatar} aria-hidden="true" />
                      <div style={{ minWidth: 0 }}>
                        <div className={styles.detailIngName}>{ing.name}</div>
                        <div className={styles.detailIngAmt}>{ing.amount}</div>
                      </div>
                    </div>
                    <div className={styles.detailIngLevel}>
                      <span className={`${styles.dot} ${levelDotClass(ing.stockLevel)}`} aria-hidden="true" />
                      <span className={`${styles.stockText} ${levelTextClass(ing.stockLevel)}`}>{levelText[ing.stockLevel]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
