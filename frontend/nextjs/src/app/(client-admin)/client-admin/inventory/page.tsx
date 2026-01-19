'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './Inventory.module.css';
import {
  listMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  listOutlets,
  listIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  listIngredientCategories,
  createStockMovement,
  listUnitsOfMeasure,
  createUnitOfMeasure,
  updateUnitOfMeasure,
  deleteUnitOfMeasure,
  type MenuCategoryResponse,
  type MenuCategoryUpsertInput,
  type IngredientResponse,
  type IngredientUpsertInput,
  type IngredientCategoryResponse,
  type StockMovementCreateInput,
  type UnitOfMeasureResponse,
  type UnitOfMeasureUpsertInput,
} from '@/lib/api/clientAdmin';

type StockLevel = 'high' | 'medium' | 'low' | 'empty';
type DishStatus = 'available' | 'not-available';

type Dish = {
  id: string;
  name: string;
  category: string;
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

function stockStatusToLevel(stockStatus: string): StockLevel {
  switch (stockStatus) {
    case 'HIGH':
      return 'high';
    case 'MEDIUM':
      return 'medium';
    case 'LOW':
      return 'low';
    case 'OUT_OF_STOCK':
      return 'empty';
    default:
      return 'medium';
  }
}

function stockStatusToDisplay(stockStatus: string): 'Need Request' | 'Normal' | 'Good' {
  switch (stockStatus) {
    case 'HIGH':
      return 'Good';
    case 'MEDIUM':
      return 'Normal';
    case 'LOW':
    case 'OUT_OF_STOCK':
      return 'Need Request';
    default:
      return 'Normal';
  }
}

function statusPillClass(status: 'Need Request' | 'Normal' | 'Good') {
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
    ],
  },
];

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'Menu' | 'Ingredients' | 'Categories' | 'Units' | 'Request List'>('Ingredients');
  const [query, setQuery] = useState('');

  const [dishStatusFilter, setDishStatusFilter] = useState<'All' | 'Available' | 'Not Available'>('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'Low' | 'Medium' | 'High' | 'Empty'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addStep, setAddStep] = useState<1 | 2>(1);
  const [selectedDishCategory, setSelectedDishCategory] = useState<string>('');

  const [detailDish, setDetailDish] = useState<Dish | null>(null);

  // Outlet state
  const [outletId, setOutletId] = useState<string | null>(null);

  // Menu Category management state
  const [menuCategories, setMenuCategories] = useState<MenuCategoryResponse[]>([]);
  const [menuCategoriesLoading, setMenuCategoriesLoading] = useState(false);
  const [menuCategoryError, setMenuCategoryError] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategoryResponse | null>(null);
  const [categoryForm, setCategoryForm] = useState<MenuCategoryUpsertInput>({ name: '', sortOrder: 0, status: 'ACTIVE' });
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  // Ingredient management state
  const [ingredients, setIngredients] = useState<IngredientResponse[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [ingredientError, setIngredientError] = useState<string | null>(null);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<IngredientResponse | null>(null);
  const [ingredientForm, setIngredientForm] = useState<IngredientUpsertInput>({
    name: '',
    unitId: '',
    costPrice: 0,
    trackInventory: true,
    currentStock: 0,
  });
  const [ingredientSubmitting, setIngredientSubmitting] = useState(false);
  const [deletingIngredientId, setDeletingIngredientId] = useState<string | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientResponse | null>(null);

  // Ingredient Categories state
  const [ingredientCategories, setIngredientCategories] = useState<IngredientCategoryResponse[]>([]);
  const [ingredientCategoriesLoading, setIngredientCategoriesLoading] = useState(false);

  // Units of Measure state
  const [units, setUnits] = useState<UnitOfMeasureResponse[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitOfMeasureResponse | null>(null);
  const [unitForm, setUnitForm] = useState<UnitOfMeasureUpsertInput>({
    name: '',
    abbreviation: '',
    unitType: 'COUNT',
    status: 'ACTIVE',
  });
  const [unitSubmitting, setUnitSubmitting] = useState(false);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);

  // Stock Movement Modal
  const [isStockMovementModalOpen, setIsStockMovementModalOpen] = useState(false);
  const [stockMovementForm, setStockMovementForm] = useState<StockMovementCreateInput>({
    ingredientId: '',
    movementType: 'PURCHASE',
    quantity: 0,
    unitId: '',
  });
  const [stockMovementSubmitting, setStockMovementSubmitting] = useState(false);

  const dishes = useMemo(() => dishesSeed, []);

  // Fetch outlet ID on mount
  useEffect(() => {
    listOutlets()
      .then((outlets) => {
        if (outlets && outlets.length > 0) {
          setOutletId(outlets[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch menu categories
  const fetchMenuCategories = useCallback(async () => {
    if (!outletId) return;
    setMenuCategoriesLoading(true);
    setMenuCategoryError(null);
    try {
      const data = await listMenuCategories(outletId);
      setMenuCategories(data || []);
    } catch (err: any) {
      setMenuCategoryError(err?.message || 'Failed to load categories');
    } finally {
      setMenuCategoriesLoading(false);
    }
  }, [outletId]);

  // Fetch ingredients
  const fetchIngredients = useCallback(async () => {
    if (!outletId) return;
    setIngredientsLoading(true);
    setIngredientError(null);
    try {
      const data = await listIngredients(outletId);
      setIngredients(data || []);
    } catch (err: any) {
      setIngredientError(err?.message || 'Failed to load ingredients');
    } finally {
      setIngredientsLoading(false);
    }
  }, [outletId]);

  // Fetch ingredient categories
  const fetchIngredientCategories = useCallback(async () => {
    if (!outletId) return;
    setIngredientCategoriesLoading(true);
    try {
      const data = await listIngredientCategories(outletId);
      setIngredientCategories(data || []);
    } catch (err: any) {
      console.error('Failed to load ingredient categories', err);
    } finally {
      setIngredientCategoriesLoading(false);
    }
  }, [outletId]);

  // Fetch units of measure
  const fetchUnits = useCallback(async () => {
    if (!outletId) return;
    setUnitsLoading(true);
    try {
      const data = await listUnitsOfMeasure(outletId);
      setUnits(data || []);
    } catch (err: any) {
      console.error('Failed to load units', err);
    } finally {
      setUnitsLoading(false);
    }
  }, [outletId]);

  // Fetch all data on mount
  useEffect(() => {
    if (outletId) {
      fetchMenuCategories();
      fetchIngredients();
      fetchIngredientCategories();
      fetchUnits();
    }
  }, [outletId, fetchMenuCategories, fetchIngredients, fetchIngredientCategories, fetchUnits]);

  const activeMenuCategories = useMemo(() => {
    return menuCategories.filter((c) => c.status === 'ACTIVE');
  }, [menuCategories]);

  const activeIngredientCategories = useMemo(() => {
    return ingredientCategories.filter((c) => c.status === 'ACTIVE');
  }, [ingredientCategories]);

  // Menu Category handlers
  const openAddMenuCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', sortOrder: menuCategories.length, status: 'ACTIVE' });
    setIsCategoryModalOpen(true);
  };

  const openEditMenuCategory = (cat: MenuCategoryResponse) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, sortOrder: cat.sortOrder, status: cat.status });
    setIsCategoryModalOpen(true);
  };

  const handleMenuCategorySubmit = async () => {
    if (!outletId || !categoryForm.name.trim()) return;
    setCategorySubmitting(true);
    try {
      if (editingCategory) {
        await updateMenuCategory(outletId, editingCategory.id, categoryForm);
      } else {
        await createMenuCategory(outletId, categoryForm);
      }
      setIsCategoryModalOpen(false);
      fetchMenuCategories();
    } catch (err: any) {
      alert(err?.message || 'Failed to save category');
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleDeleteMenuCategory = async (categoryId: string) => {
    if (!outletId) return;
    if (!confirm('Are you sure you want to delete this category?')) return;
    setDeletingCategoryId(categoryId);
    try {
      await deleteMenuCategory(outletId, categoryId);
      fetchMenuCategories();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete category');
    } finally {
      setDeletingCategoryId(null);
    }
  };

  // Ingredient handlers
  const openAddIngredient = () => {
    setEditingIngredient(null);
    setIngredientForm({
      name: '',
      unitId: '',
      costPrice: 0,
      trackInventory: true,
      currentStock: 0,
    });
    setIsIngredientModalOpen(true);
  };

  const openEditIngredient = (ing: IngredientResponse) => {
    setEditingIngredient(ing);
    setIngredientForm({
      name: ing.name,
      unitId: ing.unitId,
      costPrice: ing.costPrice,
      trackInventory: ing.trackInventory,
      currentStock: ing.currentStock,
    });
    setIsIngredientModalOpen(true);
  };

  const handleIngredientSubmit = async () => {
    if (!outletId || !ingredientForm.name.trim() || !ingredientForm.unitId) return;
    setIngredientSubmitting(true);
    try {
      if (editingIngredient) {
        await updateIngredient(outletId, editingIngredient.id, ingredientForm);
      } else {
        await createIngredient(outletId, ingredientForm);
      }
      setIsIngredientModalOpen(false);
      fetchIngredients();
    } catch (err: any) {
      alert(err?.message || 'Failed to save ingredient');
    } finally {
      setIngredientSubmitting(false);
    }
  };

  const handleDeleteIngredient = async (ingredientId: string) => {
    if (!outletId) return;
    if (!confirm('Are you sure you want to delete this ingredient?')) return;
    setDeletingIngredientId(ingredientId);
    try {
      await deleteIngredient(outletId, ingredientId);
      fetchIngredients();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete ingredient');
    } finally {
      setDeletingIngredientId(null);
    }
  };

  // Stock Movement handlers
  const openStockMovement = (ing: IngredientResponse) => {
    setStockMovementForm({
      ingredientId: ing.id,
      movementType: 'PURCHASE',
      quantity: 0,
      unitId: ing.unitId,
    });
    setSelectedIngredient(ing);
    setIsStockMovementModalOpen(true);
  };

  const handleStockMovementSubmit = async () => {
    if (!outletId || !stockMovementForm.ingredientId || stockMovementForm.quantity <= 0) return;
    setStockMovementSubmitting(true);
    try {
      await createStockMovement(outletId, stockMovementForm);
      setIsStockMovementModalOpen(false);
      fetchIngredients();
    } catch (err: any) {
      alert(err?.message || 'Failed to record stock movement');
    } finally {
      setStockMovementSubmitting(false);
    }
  };

  // Unit of Measure handlers
  const openAddUnit = () => {
    setEditingUnit(null);
    setUnitForm({
      name: '',
      abbreviation: '',
      unitType: 'COUNT',
      status: 'ACTIVE',
    });
    setIsUnitModalOpen(true);
  };

  const openEditUnit = (unit: UnitOfMeasureResponse) => {
    setEditingUnit(unit);
    setUnitForm({
      name: unit.name,
      abbreviation: unit.abbreviation,
      unitType: unit.unitType,
      baseUnitId: unit.baseUnitId || undefined,
      conversionFactor: unit.conversionFactor || undefined,
      status: unit.status,
    });
    setIsUnitModalOpen(true);
  };

  const handleUnitSubmit = async () => {
    if (!outletId || !unitForm.name.trim() || !unitForm.abbreviation.trim()) return;
    setUnitSubmitting(true);
    try {
      if (editingUnit) {
        await updateUnitOfMeasure(outletId, editingUnit.id, unitForm);
      } else {
        await createUnitOfMeasure(outletId, unitForm);
      }
      setIsUnitModalOpen(false);
      fetchUnits();
    } catch (err: any) {
      alert(err?.message || 'Failed to save unit');
    } finally {
      setUnitSubmitting(false);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!outletId) return;
    if (!confirm('Are you sure you want to delete this unit? This may affect ingredients using this unit.')) return;
    setDeletingUnitId(unitId);
    try {
      await deleteUnitOfMeasure(outletId, unitId);
      fetchUnits();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete unit');
    } finally {
      setDeletingUnitId(null);
    }
  };

  const filteredMenuCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menuCategories.filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [menuCategories, query]);

  const counts = useMemo(() => {
    const totalStockAll = ingredients.length + dishes.length;
    const low = ingredients.filter((i) => i.stockStatus === 'LOW').length;
    const medium = ingredients.filter((i) => i.stockStatus === 'MEDIUM').length;
    const high = ingredients.filter((i) => i.stockStatus === 'HIGH').length;
    const empty = ingredients.filter((i) => i.stockStatus === 'OUT_OF_STOCK').length;

    const catCounts: Record<string, number> = { All: ingredients.length };
    activeIngredientCategories.forEach((cat) => {
      catCounts[cat.name] = ingredients.filter((i) => i.categoryId === cat.id).length;
    });

    const dishCatCounts: Record<string, number> = { All: dishes.length };
    activeMenuCategories.forEach((cat) => {
      dishCatCounts[cat.name] = dishes.filter((d) => d.category === cat.name).length;
    });

    return { totalStockAll, low, medium, high, empty, catCounts, dishCatCounts };
  }, [dishes, ingredients, activeMenuCategories, activeIngredientCategories]);

  const filteredDishes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes
      .filter((d) => !q || d.name.toLowerCase().includes(q))
      .filter((d) => dishStatusFilter === 'All' || (dishStatusFilter === 'Available' ? d.status === 'available' : d.status === 'not-available'))
      .filter((d) => categoryFilter === 'All' || d.category === categoryFilter)
      .filter((d) => stockFilter === 'All' || d.stockLevel === stockFilter.toLowerCase());
  }, [categoryFilter, dishStatusFilter, dishes, query, stockFilter]);

  const filteredIngredients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ingredients
      .filter((i) => !q || i.name.toLowerCase().includes(q))
      .filter((i) => {
        if (categoryFilter === 'All') return true;
        const cat = activeIngredientCategories.find((c) => c.name === categoryFilter);
        return cat ? i.categoryId === cat.id : true;
      })
      .filter((i) => {
        if (stockFilter === 'All') return true;
        const level = stockStatusToLevel(i.stockStatus);
        return level === stockFilter.toLowerCase();
      });
  }, [categoryFilter, ingredients, query, stockFilter, activeIngredientCategories]);

  const headerTitle =
    activeTab === 'Ingredients'
      ? 'Search Ingredients Name Here'
      : activeTab === 'Categories'
      ? 'Search Category Name Here'
      : 'Search Dish Name Here';
  const addLabel =
    activeTab === 'Ingredients'
      ? 'Add New Ingredient'
      : activeTab === 'Categories'
      ? 'Add New Category'
      : 'Add New Dish';

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div className={styles.titlePill}>
          <span aria-hidden="true">⌂</span>
          <span>Inventory</span>
        </div>

        <div className={styles.headerMid}>
          <div className={styles.tabs}>
            {(['Menu', 'Ingredients', 'Categories', 'Request List', 'Units'] as const).map((t) => (
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
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={activeTab === 'Units' ? 'Search Unit Name Here' : headerTitle} />
          </div>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => {
              if (activeTab === 'Request List') return;
              if (activeTab === 'Categories') {
                openAddMenuCategory();
                return;
              }
              if (activeTab === 'Ingredients') {
                openAddIngredient();
                return;
              }
              if (activeTab === 'Units') {
                openAddUnit();
                return;
              }
              setIsAddOpen(true);
              setAddStep(1);
            }}
            disabled={activeTab === 'Request List'}
          >
            <PlusIcon />
            {activeTab === 'Units' ? 'Add New Unit' : addLabel}
          </button>
        </div>
      </div>

      <div className={styles.shell}>
        {activeTab !== 'Categories' && activeTab !== 'Units'&& (
          <aside className={styles.filterCard}>
            <div className={styles.filterTitle}>Filter</div>

            {activeTab === 'Menu' && (
              <div className={styles.filterSection}>
                <div className={styles.filterLabel}>DISHES STATUS</div>
                <div className={styles.chipsWrap}>
                  {(['All', 'Available', 'Not Available'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.chip} ${dishStatusFilter === s ? styles.chipActive : ''}`}
                      onClick={() => setDishStatusFilter(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.filterSection}>
              <div className={styles.filterLabel}>STOCK LEVEL</div>
              <div className={styles.chipsWrap}>
                {([
                  { label: 'All', count: counts.totalStockAll },
                  { label: 'Low', count: counts.low },
                  { label: 'Medium', count: counts.medium },
                  { label: 'High', count: counts.high },
                  { label: 'Empty', count: counts.empty },
                ] as const).map((x) => (
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
              {activeTab === 'Ingredients' ? (
                <div className={styles.categoryList}>
                  <button
                    type="button"
                    className={`${styles.categoryBtn} ${categoryFilter === 'All' ? styles.categoryBtnActive : ''}`}
                    onClick={() => setCategoryFilter('All')}
                  >
                    <span className={styles.categoryText}>
                      <span aria-hidden="true">🧾</span>
                      <span>All</span>
                    </span>
                    <span className={styles.categoryCount}>{counts.catCounts.All}</span>
                  </button>
                  {ingredientCategoriesLoading ? (
                    <span style={{ fontSize: 12, opacity: 0.7 }}>Loading...</span>
                  ) : (
                    activeIngredientCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`${styles.categoryBtn} ${categoryFilter === cat.name ? styles.categoryBtnActive : ''}`}
                        onClick={() => setCategoryFilter(cat.name)}
                      >
                        <span className={styles.categoryText}>
                          <span aria-hidden="true">{cat.icon || '📦'}</span>
                          <span>{cat.name}</span>
                        </span>
                        <span className={styles.categoryCount}>{counts.catCounts[cat.name] || 0}</span>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className={styles.chipsWrap}>
                  <button
                    type="button"
                    className={`${styles.chip} ${categoryFilter === 'All' ? styles.chipActive : ''}`}
                    onClick={() => setCategoryFilter('All')}
                  >
                    All <span className={styles.badgeCount}>{counts.dishCatCounts.All}</span>
                  </button>
                  {menuCategoriesLoading ? (
                    <span style={{ fontSize: 12, opacity: 0.7 }}>Loading...</span>
                  ) : (
                    activeMenuCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`${styles.chip} ${categoryFilter === cat.name ? styles.chipActive : ''}`}
                        onClick={() => setCategoryFilter(cat.name)}
                      >
                        {cat.name} <span className={styles.badgeCount}>{counts.dishCatCounts[cat.name] || 0}</span>
                      </button>
                    ))
                  )}
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
        )}

        <section className={activeTab === 'Categories' || activeTab === 'Units' ? styles.contentCardFull : styles.contentCard}>
          <div className={styles.contentHeader}>
            <div className={styles.contentTitle}>
              {activeTab === 'Menu' ? 'Menu List' : activeTab === 'Ingredients' ? 'Ingredients List' : activeTab === 'Categories' ? 'Categories List' : activeTab === 'Units' ? 'Units of Measure' : 'Request List'}
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
              {ingredientsLoading && <div className={styles.loadingText}>Loading ingredients...</div>}
              {ingredientError && <div className={styles.errorText}>{ingredientError}</div>}
              {!ingredientsLoading && !ingredientError && filteredIngredients.length === 0 && (
                <div className={styles.emptyText}>No ingredients found. Add one to get started.</div>
              )}
              {!ingredientsLoading && !ingredientError && filteredIngredients.map((i) => {
                const level = stockStatusToLevel(i.stockStatus);
                const displayStatus = stockStatusToDisplay(i.stockStatus);
                return (
                  <div key={i.id} className={styles.ingRow}>
                    <div className={styles.ingLeft}>
                      {i.imageUrl ? (
                        <img className={styles.ingImg} src={i.imageUrl} alt={i.name} loading="lazy" />
                      ) : (
                        <div className={styles.ingImg} style={{ background: 'rgba(243,244,246,1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div className={styles.ingName}>{i.name}</div>
                        <div className={styles.ingMeta}>
                          {i.categoryName || 'Uncategorized'} · Stock: {i.currentStock} {i.unitAbbreviation} · <span className={levelTextClass(level)}>{levelText[level]}</span>
                          {i.isSellable && <span style={{ marginLeft: 8, color: 'rgba(57,107,251,1)' }}>• Sellable</span>}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className={styles.ingColLabel}>COST / SELL</div>
                      <div className={styles.ingColValue}>
                        ${i.costPrice.toFixed(2)}
                        {i.isSellable && i.sellingPrice && <span style={{ color: 'rgba(16,185,129,1)' }}> / ${i.sellingPrice.toFixed(2)}</span>}
                      </div>
                    </div>

                    <div>
                      <div className={styles.ingColLabel}>STATUS</div>
                      <div className={statusPillClass(displayStatus)}>{displayStatus}</div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className={styles.editBtn} onClick={() => openStockMovement(i)} aria-label="Add Stock" title="Add Stock">
                        <PlusIcon />
                      </button>
                      <button type="button" className={styles.editBtn} onClick={() => openEditIngredient(i)} aria-label="Edit">
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteIngredient(i.id)}
                        disabled={deletingIngredientId === i.id}
                        aria-label="Delete"
                      >
                        {deletingIngredientId === i.id ? '...' : <TrashIcon />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'Categories' && (
            <div className={styles.categoryMgmtList}>
              {menuCategoriesLoading && <div className={styles.loadingText}>Loading categories...</div>}
              {menuCategoryError && <div className={styles.errorText}>{menuCategoryError}</div>}
              {!menuCategoriesLoading && !menuCategoryError && filteredMenuCategories.length === 0 && (
                <div className={styles.emptyText}>No categories found. Add one to get started.</div>
              )}
              {!menuCategoriesLoading && !menuCategoryError && filteredMenuCategories.map((cat) => (
                <div key={cat.id} className={styles.categoryMgmtRow}>
                  <div className={styles.categoryMgmtLeft}>
                    <div className={styles.categoryMgmtIcon}>🏷️</div>
                    <div>
                      <div className={styles.categoryMgmtName}>{cat.name}</div>
                      <div className={styles.categoryMgmtMeta}>
                        Sort Order: {cat.sortOrder} · Status: <span className={cat.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}>{cat.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.categoryMgmtActions}>
                    <button type="button" className={styles.editBtn} onClick={() => openEditMenuCategory(cat)} aria-label="Edit">
                      <EditIcon />
                    </button>
                    <button type="button" className={styles.deleteBtn} onClick={() => handleDeleteMenuCategory(cat.id)} disabled={deletingCategoryId === cat.id} aria-label="Delete">
                      {deletingCategoryId === cat.id ? '...' : <TrashIcon />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Units' && (
            <div className={styles.categoryMgmtList}>
              {unitsLoading && <div className={styles.loadingText}>Loading units...</div>}
              {unitsError && <div className={styles.errorText}>{unitsError}</div>}
              {!unitsLoading && !unitsError && units.filter((u) => !query || u.name.toLowerCase().includes(query.toLowerCase()) || u.abbreviation.toLowerCase().includes(query.toLowerCase())).length === 0 && (
                <div className={styles.emptyText}>No units found. Add one to get started.</div>
              )}
              {!unitsLoading && !unitsError && units
                .filter((u) => !query || u.name.toLowerCase().includes(query.toLowerCase()) || u.abbreviation.toLowerCase().includes(query.toLowerCase()))
                .map((unit) => (
                <div key={unit.id} className={styles.categoryMgmtRow}>
                  <div className={styles.categoryMgmtLeft}>
                    <div className={styles.categoryMgmtIcon}>📏</div>
                    <div>
                      <div className={styles.categoryMgmtName}>{unit.name} <span style={{ fontWeight: 400, color: 'rgba(109,120,139,0.95)' }}>({unit.abbreviation})</span></div>
                      <div className={styles.categoryMgmtMeta}>
                        Type: <span style={{ fontWeight: 500 }}>{unit.unitType}</span> · Status: <span className={unit.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}>{unit.status}</span>
                        {unit.baseUnitId && unit.conversionFactor && (
                          <span> · Conversion: {unit.conversionFactor}x base</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={styles.categoryMgmtActions}>
                    <button type="button" className={styles.editBtn} onClick={() => openEditUnit(unit)} aria-label="Edit">
                      <EditIcon />
                    </button>
                    <button type="button" className={styles.deleteBtn} onClick={() => handleDeleteUnit(unit.id)} disabled={deletingUnitId === unit.id} aria-label="Delete">
                      {deletingUnitId === unit.id ? '...' : <TrashIcon />}
                    </button>
                  </div>
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

      {/* Ingredient Modal */}
      {isIngredientModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsIngredientModalOpen(false); }}>
          <div className={styles.modal}>
            <div className={styles.modalTop}>
              <div className={styles.modalTitle}>{editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}</div>
              <button type="button" className={styles.iconClose} onClick={() => setIsIngredientModalOpen(false)} aria-label="Close"><XIcon /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalSidebar}>
                <div className={`${styles.stepRow} ${styles.stepRowActive}`}>
                  <span className={`${styles.stepDot} ${styles.stepDotActive}`}>1</span>
                  <span className={styles.stepText}>Basic Info</span>
                </div>
                <div className={styles.stepRow}>
                  <span className={styles.stepDot}>2</span>
                  <span className={styles.stepText}>Inventory</span>
                </div>
                <div className={styles.stepRow}>
                  <span className={styles.stepDot}>3</span>
                  <span className={styles.stepText}>Pricing</span>
                </div>
              </div>
              <div className={styles.modalContent}>
                <div className={styles.panelTitle}>Ingredient Information</div>
                <div className={styles.formStack}>
                  <div className={styles.field}>
                    <div className={styles.label}>Name *</div>
                    <input className={styles.input} placeholder="Enter ingredient name" value={ingredientForm.name} onChange={(e) => setIngredientForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className={styles.field}>
                    <div className={styles.label}>Unit *</div>
                    <select className={styles.input} value={ingredientForm.unitId} onChange={(e) => setIngredientForm((f) => ({ ...f, unitId: e.target.value }))}>
                      <option value="">-- Select Unit --</option>
                      {unitsLoading ? (
                        <option disabled>Loading...</option>
                      ) : (
                        units.filter((u) => u.status === 'ACTIVE').map((u) => (
                          <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <div className={styles.label}>Cost Price *</div>
                    <div className={styles.priceWrap}>
                      <div className={styles.pricePrefix}>$</div>
                      <input className={styles.priceInput} type="number" step="0.01" value={ingredientForm.costPrice} onChange={(e) => setIngredientForm((f) => ({ ...f, costPrice: parseFloat(e.target.value) || 0 }))} />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" checked={ingredientForm.trackInventory !== false} onChange={(e) => setIngredientForm((f) => ({ ...f, trackInventory: e.target.checked }))} />
                      <span className={styles.label} style={{ marginBottom: 0 }}>Track Inventory</span>
                    </label>
                  </div>
                  {ingredientForm.trackInventory !== false && (
                    <>
                      {!editingIngredient && (
                        <div className={styles.field}>
                          <div className={styles.label}>Initial Stock</div>
                          <input className={styles.input} type="number" step="0.01" value={ingredientForm.currentStock || ''} onChange={(e) => setIngredientForm((f) => ({ ...f, currentStock: parseFloat(e.target.value) || 0 }))} />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className={styles.modalFooter}>
                  <button type="button" className={styles.primaryBtn} onClick={handleIngredientSubmit} disabled={ingredientSubmitting || !ingredientForm.name.trim() || !ingredientForm.unitId}>
                    {ingredientSubmitting ? 'Saving...' : editingIngredient ? 'Update Ingredient' : 'Create Ingredient'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Movement Modal */}
      {isStockMovementModalOpen && selectedIngredient && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsStockMovementModalOpen(false); }}>
          <div className={styles.categoryModal}>
            <div className={styles.modalTop}>
              <div className={styles.modalTitle}>Record Stock Movement</div>
              <button type="button" className={styles.iconClose} onClick={() => setIsStockMovementModalOpen(false)} aria-label="Close"><XIcon /></button>
            </div>
            <div className={styles.categoryModalBody}>
              <div style={{ marginBottom: 16, padding: 12, background: 'rgba(243,244,246,1)', borderRadius: 12 }}>
                <strong>{selectedIngredient.name}</strong>
                <div style={{ fontSize: 12, color: 'rgba(109,120,139,0.95)', marginTop: 4 }}>
                  Current Stock: {selectedIngredient.currentStock}
                </div>
              </div>
              <div className={styles.field}>
                <div className={styles.label}>Movement Type</div>
                <select className={styles.input} value={stockMovementForm.movementType} onChange={(e) => setStockMovementForm((f) => ({ ...f, movementType: e.target.value as any }))}>
                  <option value="PURCHASE">Purchase (Add Stock)</option>
                  <option value="USAGE">Usage (Deduct Stock)</option>
                  <option value="WASTAGE">Wastage (Deduct Stock)</option>
                  <option value="ADJUSTMENT">Adjustment</option>
                  <option value="RETURN">Return (Add Stock)</option>
                </select>
              </div>
              <div className={styles.field}>
                <div className={styles.label}>Quantity</div>
                <input className={styles.input} type="number" step="0.01" placeholder="Enter quantity" value={stockMovementForm.quantity || ''} onChange={(e) => setStockMovementForm((f) => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className={styles.field}>
                <div className={styles.label}>Notes</div>
                <input className={styles.input} placeholder="Optional notes" value={stockMovementForm.notes || ''} onChange={(e) => setStockMovementForm((f) => ({ ...f, notes: e.target.value || undefined }))} />
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.primaryBtn} onClick={handleStockMovementSubmit} disabled={stockMovementSubmitting || stockMovementForm.quantity <= 0}>
                  {stockMovementSubmitting ? 'Recording...' : 'Record Movement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Category Modal */}
      {isCategoryModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsCategoryModalOpen(false); }}>
          <div className={styles.categoryModal}>
            <div className={styles.modalTop}>
              <div className={styles.modalTitle}>{editingCategory ? 'Edit Category' : 'Add New Category'}</div>
              <button type="button" className={styles.iconClose} onClick={() => setIsCategoryModalOpen(false)} aria-label="Close"><XIcon /></button>
            </div>
            <div className={styles.categoryModalBody}>
              <div className={styles.field}>
                <div className={styles.label}>Category Name</div>
                <input className={styles.input} placeholder="Enter Category Name" value={categoryForm.name} onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <div className={styles.label}>Sort Order</div>
                <input className={styles.input} type="number" placeholder="0" value={categoryForm.sortOrder ?? 0} onChange={(e) => setCategoryForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))} />
              </div>
              <div className={styles.field}>
                <div className={styles.label}>Status</div>
                <div className={styles.pillsRow}>
                  {(['ACTIVE', 'INACTIVE'] as const).map((s) => (
                    <button key={s} type="button" className={`${styles.categoryPill} ${categoryForm.status === s ? styles.categoryPillActive : ''}`} onClick={() => setCategoryForm((f) => ({ ...f, status: s }))}>{s}</button>
                  ))}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.primaryBtn} onClick={handleMenuCategorySubmit} disabled={categorySubmitting || !categoryForm.name.trim()}>
                  {categorySubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unit of Measure Modal */}
      {isUnitModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsUnitModalOpen(false); }}>
          <div className={styles.categoryModal}>
            <div className={styles.modalTop}>
              <div className={styles.modalTitle}>{editingUnit ? 'Edit Unit' : 'Add New Unit'}</div>
              <button type="button" className={styles.iconClose} onClick={() => setIsUnitModalOpen(false)} aria-label="Close"><XIcon /></button>
            </div>
            <div className={styles.categoryModalBody}>
              <div className={styles.field}>
                <div className={styles.label}>Unit Name *</div>
                <input className={styles.input} placeholder="e.g. Kilogram, Liter, Piece" value={unitForm.name} onChange={(e) => setUnitForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <div className={styles.label}>Abbreviation *</div>
                <input className={styles.input} placeholder="e.g. kg, L, pcs" value={unitForm.abbreviation} onChange={(e) => setUnitForm((f) => ({ ...f, abbreviation: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <div className={styles.label}>Unit Type *</div>
                <select className={styles.input} value={unitForm.unitType} onChange={(e) => setUnitForm((f) => ({ ...f, unitType: e.target.value as any }))}>
                  <option value="COUNT">Count (pieces, units)</option>
                  <option value="WEIGHT">Weight (kg, g, lb)</option>
                  <option value="VOLUME">Volume (L, mL, gal)</option>
                  <option value="LENGTH">Length (m, cm, in)</option>
                </select>
              </div>
              <div className={styles.field}>
                <div className={styles.label}>Base Unit (Optional)</div>
                <select className={styles.input} value={unitForm.baseUnitId || ''} onChange={(e) => setUnitForm((f) => ({ ...f, baseUnitId: e.target.value || undefined }))}>
                  <option value="">-- None (This is a base unit) --</option>
                  {units.filter((u) => u.status === 'ACTIVE' && u.unitType === unitForm.unitType && u.id !== editingUnit?.id).map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
                  ))}
                </select>
              </div>
              {unitForm.baseUnitId && (
                <div className={styles.field}>
                  <div className={styles.label}>Conversion Factor</div>
                  <input className={styles.input} type="number" step="0.0001" placeholder="e.g. 1000 (if 1 kg = 1000 g)" value={unitForm.conversionFactor || ''} onChange={(e) => setUnitForm((f) => ({ ...f, conversionFactor: parseFloat(e.target.value) || undefined }))} />
                  <div style={{ fontSize: 11, color: 'rgba(109,120,139,0.95)', marginTop: 4 }}>
                    How many of the base unit equals 1 of this unit
                  </div>
                </div>
              )}
              <div className={styles.field}>
                <div className={styles.label}>Status</div>
                <div className={styles.pillsRow}>
                  {(['ACTIVE', 'INACTIVE'] as const).map((s) => (
                    <button key={s} type="button" className={`${styles.categoryPill} ${unitForm.status === s ? styles.categoryPillActive : ''}`} onClick={() => setUnitForm((f) => ({ ...f, status: s }))}>{s}</button>
                  ))}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.primaryBtn} onClick={handleUnitSubmit} disabled={unitSubmitting || !unitForm.name.trim() || !unitForm.abbreviation.trim()}>
                  {unitSubmitting ? 'Saving...' : editingUnit ? 'Update Unit' : 'Create Unit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dish Detail Modal */}
      {detailDish && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) setDetailDish(null); }}>
          <div className={styles.detailModal}>
            <div className={styles.modalTop}>
              <div className={styles.modalTitle}>Dish Details</div>
              <button type="button" className={styles.iconClose} onClick={() => setDetailDish(null)} aria-label="Close"><XIcon /></button>
            </div>
            <div className={styles.detailModalBody}>
              <div className={styles.detailImageWrap}>
                <Image className={styles.detailImg} src={detailDish.image} alt={detailDish.name} fill sizes="400px" />
              </div>
              <div className={styles.detailInfo}>
                <div className={styles.detailName}>{detailDish.name}</div>
                <div className={styles.detailCategory}>{detailDish.category}</div>
                <div className={styles.detailMeta}>
                  <span>Can be served {detailDish.canBeServed}</span>
                  <span>·</span>
                  <span className={levelTextClass(detailDish.stockLevel)}>{levelText[detailDish.stockLevel]}</span>
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

      {/* Add Dish Modal */}
      {isAddOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsAddOpen(false); }}>
          <div className={styles.modal}>
            <div className={styles.modalTop}>
              <div className={styles.modalTitle}>Add New Dish</div>
              <button type="button" className={styles.iconClose} onClick={() => setIsAddOpen(false)} aria-label="Close"><XIcon /></button>
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
                          {menuCategoriesLoading ? (
                            <span style={{ fontSize: 12, opacity: 0.7 }}>Loading...</span>
                          ) : activeMenuCategories.length === 0 ? (
                            <span style={{ fontSize: 12, opacity: 0.7 }}>No categories. Add one first.</span>
                          ) : (
                            activeMenuCategories.map((cat) => (
                              <button key={cat.id} type="button" className={`${styles.categoryPill} ${selectedDishCategory === cat.name ? styles.categoryPillActive : ''}`} onClick={() => setSelectedDishCategory(cat.name)}>{cat.name}</button>
                            ))
                          )}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <div className={styles.label}>Description</div>
                        <textarea className={styles.textarea} placeholder="Enter description" />
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
                      <button type="button" className={styles.primaryBtn} onClick={() => setAddStep(2)}>Save and Next</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.panelTitle}>Ingredients</div>
                    <div className={styles.ingredientsGrid}>
                      <div className={styles.field}>
                        <div className={styles.label}>Ingredient</div>
                        <select className={styles.input}>
                          <option value="">-- Select --</option>
                          {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                      </div>
                      <div className={styles.field}>
                        <div className={styles.label}>Quantity</div>
                        <input className={styles.input} type="number" />
                      </div>
                      <div className={styles.field}>
                        <div className={styles.label}>Unit</div>
                        <select className={styles.input}>
                          <option value="">-- Select --</option>
                        </select>
                      </div>
                    </div>
                    <button type="button" className={styles.outlineBtn}><PlusIcon /> Add Ingredient</button>
                    <div className={styles.modalFooter}>
                      <button type="button" className={styles.primaryBtn} onClick={() => setIsAddOpen(false)}>Save and Submit</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
