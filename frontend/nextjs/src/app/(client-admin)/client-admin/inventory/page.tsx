'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './Inventory.module.css';
import {
  listMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  listMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItem,
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
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  uploadMenuItemImage,
  getImageUrl,
  deleteMenuCategoriesBatch,
  deleteMenuItemsBatch,
  deleteIngredientCategoriesBatch,
  deleteUnitsOfMeasureBatch,
  deleteSuppliersBatch,
  deleteIngredientsBatch,
  type MenuCategoryResponse,
  type MenuCategoryUpsertInput,
  type MenuItemResponse,
  type MenuItemUpsertInput,
  type IngredientResponse,
  type IngredientUpsertInput,
  type IngredientCategoryResponse,
  type StockMovementCreateInput,
  type UnitOfMeasureResponse,
  type UnitOfMeasureUpsertInput,
  type SupplierResponse,
  type SupplierUpsertInput,
} from '@/lib/api/clientAdmin';
import ImageUploadDropbox from '@/components/ui/ImageUploadDropbox';
import RecipeManager from '@/components/ui/RecipeManager';
import { useOutlet } from '@/contexts/OutletContext';

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

function VegIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="2" stroke="#16a34a" strokeWidth="2" />
      <circle cx="12" cy="12" r="5" fill="#16a34a" />
    </svg>
  );
}

function NonVegIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="2" stroke="#dc2626" strokeWidth="2" />
      <polygon points="12,7 17,17 7,17" fill="#dc2626" />
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
  const [activeTab, setActiveTab] = useState<'Menu' | 'Ingredients' | 'Categories' | 'Units' | 'Suppliers' | 'Request List'>('Menu');
  const [query, setQuery] = useState('');

  const [dishStatusFilter, setDishStatusFilter] = useState<'All' | 'Available' | 'Not Available'>('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'Low' | 'Medium' | 'High' | 'Empty'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Menu-specific filters (to match /inventory/menu page)
  const [menuStatusFilter, setMenuStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [vegFilter, setVegFilter] = useState<'All' | 'Veg' | 'Non-Veg'>('All');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('All');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addStep, setAddStep] = useState<1 | 2>(1);
  const [selectedDishCategory, setSelectedDishCategory] = useState<string>('');

  const [detailDish, setDetailDish] = useState<Dish | null>(null);

  // Outlet from context
  const { selectedOutletId } = useOutlet();

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

  // Suppliers state
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [suppliersError, setSuppliersError] = useState<string | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierResponse | null>(null);
  const [supplierForm, setSupplierForm] = useState<SupplierUpsertInput>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    status: 'ACTIVE',
  });
  const [supplierSubmitting, setSupplierSubmitting] = useState(false);
  const [deletingSupplierId, setDeletingSupplierId] = useState<string | null>(null);

  // Menu Items state
  const [menuItems, setMenuItems] = useState<MenuItemResponse[]>([]);
  const [menuItemsLoading, setMenuItemsLoading] = useState(false);
  const [menuItemsError, setMenuItemsError] = useState<string | null>(null);
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItemResponse | null>(null);
  const [menuItemForm, setMenuItemForm] = useState<MenuItemUpsertInput>({
    name: '',
    categoryId: '',
    basePrice: 0,
    status: 'ACTIVE',
    images: [],
  });
  const [menuItemSubmitting, setMenuItemSubmitting] = useState(false);
  const [deletingMenuItemId, setDeletingMenuItemId] = useState<string | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItemResponse | null>(null);

  // Ingredient modal step state
  const [ingredientStep, setIngredientStep] = useState<1 | 2 | 3>(1);

  // Extended ingredient form state for all fields
  const [ingredientExtendedForm, setIngredientExtendedForm] = useState<{
    name: string;
    unitId: string;
    costPrice: number;
    trackInventory: boolean;
    currentStock: number;
    description?: string;
    imageUrl?: string;
    categoryId?: string;
    sku?: string;
    isSellable?: boolean;
    sellingPrice?: number;
    reorderLevel?: number;
    reorderQuantity?: number;
    maxStockLevel?: number;
    shelfLifeDays?: number;
    storageInstructions?: string;
    defaultSupplierId?: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>({
    name: '',
    unitId: '',
    costPrice: 0,
    trackInventory: true,
    currentStock: 0,
    isSellable: false,
    status: 'ACTIVE',
  });

  // Image URL input state
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Pending file uploads (files to be uploaded after menu item creation)
  const [pendingImageUploads, setPendingImageUploads] = useState<File[]>([]);

  // Multiselect state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Reset selection when tab changes
  useEffect(() => {
    setSelectedItemIds(new Set());
  }, [activeTab]);

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = (ids: string[]) => {
    if (selectedItemIds.size === ids.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(ids));
    }
  };

  const dishes = useMemo(() => dishesSeed, []);


  // Fetch menu categories
  const fetchMenuCategories = useCallback(async () => {
    if (!selectedOutletId) return;
    setMenuCategoriesLoading(true);
    setMenuCategoryError(null);
    try {
      const data = await listMenuCategories(selectedOutletId);
      setMenuCategories(data || []);
    } catch (err: any) {
      setMenuCategoryError(err?.message || 'Failed to load categories');
    } finally {
      setMenuCategoriesLoading(false);
    }
  }, [selectedOutletId]);

  // Fetch ingredients
  const fetchIngredients = useCallback(async () => {
    if (!selectedOutletId) return;
    setIngredientsLoading(true);
    setIngredientError(null);
    try {
      const data = await listIngredients(selectedOutletId);
      setIngredients(data || []);
    } catch (err: any) {
      setIngredientError(err?.message || 'Failed to load ingredients');
    } finally {
      setIngredientsLoading(false);
    }
  }, [selectedOutletId]);

  // Fetch ingredient categories
  const fetchIngredientCategories = useCallback(async () => {
    if (!selectedOutletId) return;
    setIngredientCategoriesLoading(true);
    try {
      const data = await listIngredientCategories(selectedOutletId);
      setIngredientCategories(data || []);
    } catch (err: any) {
      console.error('Failed to load ingredient categories', err);
    } finally {
      setIngredientCategoriesLoading(false);
    }
  }, [selectedOutletId]);

  // Fetch units of measure
  const fetchUnits = useCallback(async () => {
    if (!selectedOutletId) return;
    setUnitsLoading(true);
    try {
      const data = await listUnitsOfMeasure(selectedOutletId);
      setUnits(data || []);
    } catch (err: any) {
      console.error('Failed to load units', err);
    } finally {
      setUnitsLoading(false);
    }
  }, [selectedOutletId]);

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    if (!selectedOutletId) return;
    setSuppliersLoading(true);
    setSuppliersError(null);
    try {
      const data = await listSuppliers(selectedOutletId);
      setSuppliers(data || []);
    } catch (err: any) {
      setSuppliersError(err?.message || 'Failed to load suppliers');
      console.error('Failed to load suppliers', err);
    } finally {
      setSuppliersLoading(false);
    }
  }, [selectedOutletId]);

  // Fetch menu items
  const fetchMenuItems = useCallback(async () => {
    if (!selectedOutletId) return;
    setMenuItemsLoading(true);
    setMenuItemsError(null);
    try {
      const data = await listMenuItems(selectedOutletId);
      setMenuItems(data || []);
    } catch (err: any) {
      setMenuItemsError(err?.message || 'Failed to load menu items');
      console.error('Failed to load menu items', err);
    } finally {
      setMenuItemsLoading(false);
    }
  }, [selectedOutletId]);

  // Fetch all data on mount
  useEffect(() => {
    if (selectedOutletId) {
      fetchMenuCategories();
      fetchIngredients();
      fetchIngredientCategories();
      fetchUnits();
      fetchSuppliers();
      fetchMenuItems();
    }
  }, [selectedOutletId, fetchMenuCategories, fetchIngredients, fetchIngredientCategories, fetchUnits, fetchSuppliers, fetchMenuItems]);

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
    if (!selectedOutletId || !categoryForm.name.trim()) return;
    setCategorySubmitting(true);
    try {
      if (editingCategory) {
        await updateMenuCategory(selectedOutletId, editingCategory.id, categoryForm);
      } else {
        await createMenuCategory(selectedOutletId, categoryForm);
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
    if (!selectedOutletId) return;
    if (!confirm('Are you sure you want to delete this category?')) return;
    setDeletingCategoryId(categoryId);
    try {
      await deleteMenuCategory(selectedOutletId, categoryId);
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
    setIngredientExtendedForm({
      name: '',
      unitId: '',
      costPrice: 0,
      trackInventory: true,
      currentStock: 0,
      isSellable: false,
      status: 'ACTIVE',
    });
    setIngredientStep(1);
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
    setIngredientExtendedForm({
      name: ing.name,
      unitId: ing.unitId,
      costPrice: ing.costPrice,
      trackInventory: ing.trackInventory,
      currentStock: ing.currentStock,
      description: ing.description ?? undefined,
      imageUrl: ing.imageUrl ?? undefined,
      categoryId: ing.categoryId ?? undefined,
      sku: ing.sku ?? undefined,
      isSellable: ing.isSellable ?? undefined,
      sellingPrice: ing.sellingPrice ?? undefined,
      reorderLevel: ing.reorderLevel ?? undefined,
      reorderQuantity: ing.reorderQuantity ?? undefined,
      maxStockLevel: ing.maxStockLevel ?? undefined,
      shelfLifeDays: ing.shelfLifeDays ?? undefined,
      storageInstructions: ing.storageInstructions ?? undefined,
      defaultSupplierId: ing.defaultSupplierId ?? undefined,
      status: ing.status,
    });
    setIngredientStep(1);
    setIsIngredientModalOpen(true);
  };

  const handleIngredientSubmit = async () => {
    if (!selectedOutletId || !ingredientExtendedForm.name.trim() || !ingredientExtendedForm.unitId) return;
    setIngredientSubmitting(true);
    try {
      if (editingIngredient) {
        await updateIngredient(selectedOutletId, editingIngredient.id, ingredientExtendedForm);
      } else {
        await createIngredient(selectedOutletId, ingredientExtendedForm);
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
    if (!selectedOutletId) return;
    if (!confirm('Are you sure you want to delete this ingredient?')) return;
    setDeletingIngredientId(ingredientId);
    try {
      await deleteIngredient(selectedOutletId, ingredientId);
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
    if (!selectedOutletId || !stockMovementForm.ingredientId || stockMovementForm.quantity <= 0) return;
    setStockMovementSubmitting(true);
    try {
      await createStockMovement(selectedOutletId, stockMovementForm);
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
    if (!selectedOutletId || !unitForm.name.trim() || !unitForm.abbreviation.trim()) return;
    setUnitSubmitting(true);
    try {
      if (editingUnit) {
        await updateUnitOfMeasure(selectedOutletId, editingUnit.id, unitForm);
      } else {
        await createUnitOfMeasure(selectedOutletId, unitForm);
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
    if (!selectedOutletId) return;
    if (!confirm('Are you sure you want to delete this unit? This may affect ingredients using this unit.')) return;
    setDeletingUnitId(unitId);
    try {
      await deleteUnitOfMeasure(selectedOutletId, unitId);
      fetchUnits();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete unit');
    } finally {
      setDeletingUnitId(null);
    }
  };

  // Supplier handlers
  const openAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      status: 'ACTIVE',
    });
    setIsSupplierModalOpen(true);
  };

  const openEditSupplier = (supplier: SupplierResponse) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
      status: supplier.status,
    });
    setIsSupplierModalOpen(true);
  };

  const handleSupplierSubmit = async () => {
    if (!selectedOutletId || !supplierForm.name.trim()) return;
    setSupplierSubmitting(true);
    try {
      if (editingSupplier) {
        await updateSupplier(selectedOutletId, editingSupplier.id, supplierForm);
      } else {
        await createSupplier(selectedOutletId, supplierForm);
      }
      setIsSupplierModalOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      alert(err?.message || 'Failed to save supplier');
    } finally {
      setSupplierSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!selectedOutletId) return;
    if (!confirm('Are you sure you want to delete this supplier? This may affect ingredients linked to this supplier.')) return;
    setDeletingSupplierId(supplierId);
    try {
      await deleteSupplier(selectedOutletId, supplierId);
      fetchSuppliers();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete supplier');
    } finally {
      setDeletingSupplierId(null);
    }
  };
  const handleBulkDelete = async () => {
    if (!selectedOutletId || selectedItemIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedItemIds.size} selected items?`)) return;

    setIsBulkDeleting(true);
    const ids = Array.from(selectedItemIds);
    try {
      switch (activeTab) {
        case 'Menu':
          await deleteMenuItemsBatch(selectedOutletId, ids);
          fetchMenuItems();
          break;
        case 'Ingredients':
          await deleteIngredientsBatch(selectedOutletId, ids);
          fetchIngredients();
          break;
        case 'Categories':
          await deleteMenuCategoriesBatch(selectedOutletId, ids);
          fetchMenuCategories();
          break;
        case 'Units':
          await deleteUnitsOfMeasureBatch(selectedOutletId, ids);
          fetchUnits();
          break;
        case 'Suppliers':
          await deleteSuppliersBatch(selectedOutletId, ids);
          fetchSuppliers();
          break;
      }
      setSelectedItemIds(new Set());
    } catch (err: any) {
      alert(err?.message || 'Failed to delete items');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Menu Item handlers
  const openAddMenuItem = () => {
    setEditingMenuItem(null);
    setMenuItemForm({
      name: '',
      categoryId: activeMenuCategories.length > 0 ? activeMenuCategories[0].id : '',
      basePrice: 0,
      status: 'ACTIVE',
      images: [],
    });
    setImageUrlInput('');
    setPendingImageUploads([]);
    setIsMenuItemModalOpen(true);
  };

  const openEditMenuItem = (item: MenuItemResponse) => {
    setEditingMenuItem(item);
    setMenuItemForm({
      name: item.name,
      description: item.description || undefined,
      categoryId: item.categoryId || '',
      basePrice: item.basePrice,
      isVeg: item.isVeg,
      status: item.status,
      images: item.images?.map((img) => ({
        imageUrl: img.imageUrl,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
      })) || [],
    });
    setImageUrlInput('');
    setPendingImageUploads([]);
    setIsMenuItemModalOpen(true);
  };

  const handleMenuItemSubmit = async () => {
    if (!selectedOutletId || !menuItemForm.name.trim()) return;
    setMenuItemSubmitting(true);
    try {
      // Filter out data URLs (preview URLs) from images when creating new item
      const imagesToSubmit = editingMenuItem
        ? menuItemForm.images
        : menuItemForm.images?.filter((img) => !img.imageUrl.startsWith('data:'));

      const formDataToSubmit = {
        ...menuItemForm,
        images: imagesToSubmit,
      };

      let menuItemId: string;
      if (editingMenuItem) {
        await updateMenuItem(selectedOutletId, editingMenuItem.id, formDataToSubmit);
        menuItemId = editingMenuItem.id;
      } else {
        const newItem = await createMenuItem(selectedOutletId, formDataToSubmit);
        menuItemId = newItem.id;
      }

      // Upload pending image files (for new items)
      if (pendingImageUploads.length > 0) {
        const existingImageCount = imagesToSubmit?.length || 0;
        for (let i = 0; i < pendingImageUploads.length; i++) {
          const file = pendingImageUploads[i];
          try {
            await uploadMenuItemImage(selectedOutletId, menuItemId, file, {
              isPrimary: existingImageCount === 0 && i === 0,
              sortOrder: existingImageCount + i,
            });
          } catch (err: any) {
            console.error('Failed to upload image:', err);
            // Continue with other uploads even if one fails
          }
        }
      }

      setIsMenuItemModalOpen(false);
      fetchMenuItems();
    } catch (err: any) {
      alert(err?.message || 'Failed to save menu item');
    } finally {
      setMenuItemSubmitting(false);
    }
  };

  const handleDeleteMenuItem = async (menuItemId: string) => {
    if (!selectedOutletId) return;
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    setDeletingMenuItemId(menuItemId);
    try {
      await deleteMenuItem(selectedOutletId, menuItemId);
      fetchMenuItems();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete menu item');
    } finally {
      setDeletingMenuItemId(null);
    }
  };

  // Helper functions for image management
  const addImage = () => {
    if (!imageUrlInput.trim()) return;
    const newImages = [
      ...(menuItemForm.images || []),
      {
        imageUrl: imageUrlInput.trim(),
        sortOrder: (menuItemForm.images?.length || 0),
        isPrimary: (menuItemForm.images?.length || 0) === 0,
      },
    ];
    setMenuItemForm({ ...menuItemForm, images: newImages });
    setImageUrlInput('');
  };

  const removeImage = (index: number) => {
    const images = menuItemForm.images || [];
    const imageToRemove = images[index];

    // If it's a preview URL (data URL), also remove from pending uploads
    if (imageToRemove?.imageUrl?.startsWith('data:')) {
      // Find the corresponding file index (they should be in the same order)
      const previewIndex = images
        .slice(0, index)
        .filter((img) => img.imageUrl?.startsWith('data:')).length;
      setPendingImageUploads((prev) => prev.filter((_, i) => i !== previewIndex));
    }

    const newImages = images.filter((_, i) => i !== index);
    // If we removed the primary, make the first one primary
    if (newImages.length > 0 && !newImages.some((img) => img.isPrimary)) {
      newImages[0].isPrimary = true;
    }
    setMenuItemForm({ ...menuItemForm, images: newImages });
  };

  // Handle image file upload
  const handleImageUpload = async (file: File): Promise<string> => {
    if (!selectedOutletId) {
      throw new Error('Outlet ID is required');
    }

    // If editing an existing item, upload immediately
    if (editingMenuItem) {
      try {
        const currentImageCount = menuItemForm.images?.length || 0;
        const response = await uploadMenuItemImage(selectedOutletId, editingMenuItem.id, file, {
          isPrimary: currentImageCount === 0,
          sortOrder: currentImageCount,
        });

        // Refresh menu item data to get updated images
        const updatedItem = await getMenuItem(selectedOutletId, editingMenuItem.id);
        setMenuItemForm({
          ...menuItemForm,
          images: updatedItem.images?.map((img) => ({
            imageUrl: img.imageUrl,
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
          })) || [],
        });

        return response.imageUrl;
      } catch (err: any) {
        throw new Error(err?.message || 'Failed to upload image');
      }
    } else {
      // If creating a new item, store file for later upload and show preview
      setPendingImageUploads((prev) => [...prev, file]);

      // Return a preview URL and add to images array temporarily
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const previewUrl = reader.result as string;
          // Add preview to images array temporarily (will be filtered out on submit)
          const currentImageCount = menuItemForm.images?.length || 0;
          const newImages = [
            ...(menuItemForm.images || []),
            {
              imageUrl: previewUrl,
              sortOrder: currentImageCount,
              isPrimary: currentImageCount === 0,
            },
          ];
          setMenuItemForm({ ...menuItemForm, images: newImages });
          resolve(previewUrl);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const setPrimaryImage = (index: number) => {
    const newImages = (menuItemForm.images || []).map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    setMenuItemForm({ ...menuItemForm, images: newImages });
  };

  // Menu items counts (to match /inventory/menu page)
  const menuItemsCounts = useMemo(() => {
    const total = menuItems.length;
    const active = menuItems.filter((i) => i.status === 'ACTIVE').length;
    const inactive = menuItems.filter((i) => i.status === 'INACTIVE').length;
    const veg = menuItems.filter((i) => i.isVeg).length;
    const nonVeg = menuItems.filter((i) => !i.isVeg).length;

    const catCounts: Record<string, number> = { All: total };
    activeMenuCategories.forEach((cat) => {
      catCounts[cat.id] = menuItems.filter((i) => i.categoryId === cat.id).length;
    });

    return { total, active, inactive, veg, nonVeg, catCounts };
  }, [menuItems, activeMenuCategories]);

  const filteredMenuItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menuItems
      .filter((item) => !q || item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q))
      .filter((item) => {
        if (menuStatusFilter === 'All') return true;
        return menuStatusFilter === 'Active' ? item.status === 'ACTIVE' : item.status === 'INACTIVE';
      })
      .filter((item) => {
        if (menuCategoryFilter === 'All') return true;
        return item.categoryId === menuCategoryFilter;
      })
      .filter((item) => {
        if (vegFilter === 'All') return true;
        return vegFilter === 'Veg' ? item.isVeg : !item.isVeg;
      });
  }, [menuItems, query, menuStatusFilter, menuCategoryFilter, vegFilter]);
  console.log("🚀 ~ InventoryPage ~ filteredMenuItems:", filteredMenuItems)

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

  const filteredSuppliers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return suppliers.filter((s) =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phone && s.phone.toLowerCase().includes(q))
    );
  }, [suppliers, query]);

  const headerTitle =
    activeTab === 'Ingredients'
      ? 'Search Ingredients Name Here'
      : activeTab === 'Categories'
        ? 'Search Category Name Here'
        : activeTab === 'Suppliers'
          ? 'Search Supplier Name Here'
          : 'Search Dish Name Here';
  const addLabel =
    activeTab === 'Ingredients'
      ? 'Ingredient'
      : activeTab === 'Categories'
        ? 'Category'
        : activeTab === 'Suppliers'
          ? 'Supplier'
          : 'Dish';

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div className={styles.titlePill}>
          <span aria-hidden="true">⌂</span>
          <span>Inventory</span>
        </div>

        <div className={styles.headerMid}>
          <div className={styles.tabs}>
            {(['Menu', 'Ingredients', 'Request List', 'Categories', 'Suppliers', 'Units'] as const).map((t) => (
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
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={activeTab === 'Units' ? 'Search Unit Name Here' : activeTab === 'Suppliers' ? 'Search Supplier Name Here' : headerTitle} />
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
              if (activeTab === 'Suppliers') {
                openAddSupplier();
                return;
              }
              if (activeTab === 'Menu') {
                openAddMenuItem();
                return;
              }
              setIsAddOpen(true);
              setAddStep(1);
            }}
            disabled={activeTab === 'Request List'}
          >
            <PlusIcon />
            {activeTab === 'Units' ? 'Unit' : activeTab === 'Suppliers' ? 'Supplier' : addLabel}
          </button>
        </div>
      </div>

      <div className={styles.shell}>
        {activeTab !== 'Categories' && activeTab !== 'Units' && activeTab !== 'Suppliers' && (
          <aside className={styles.filterCard}>
            <div className={styles.filterTitle}>Filter</div>

            {activeTab === 'Menu' && (
              <>
                {/* Status Filter - matches /inventory/menu */}
                <div className={styles.filterSection}>
                  <div className={styles.filterLabel}>STATUS</div>
                  <div className={styles.chipsWrap}>
                    {(['All', 'Active', 'Inactive'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`${styles.chip} ${menuStatusFilter === s ? styles.chipActive : ''}`}
                        onClick={() => setMenuStatusFilter(s)}
                      >
                        {s}
                        <span className={styles.badgeCount}>
                          {s === 'All' ? menuItemsCounts.total : s === 'Active' ? menuItemsCounts.active : menuItemsCounts.inactive}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Veg/Non-Veg Filter - matches /inventory/menu */}
                <div className={styles.filterSection}>
                  <div className={styles.filterLabel}>TYPE</div>
                  <div className={styles.chipsWrap}>
                    {(['All', 'Veg', 'Non-Veg'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={`${styles.chip} ${vegFilter === v ? styles.chipActive : ''}`}
                        onClick={() => setVegFilter(v)}
                      >
                        {v}
                        <span className={styles.badgeCount}>
                          {v === 'All' ? menuItemsCounts.total : v === 'Veg' ? menuItemsCounts.veg : menuItemsCounts.nonVeg}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter - matches /inventory/menu (as list) */}
                <div className={styles.filterSection}>
                  <div className={styles.filterLabel}>CATEGORY</div>
                  <div className={styles.categoryList}>
                    <button
                      type="button"
                      className={`${styles.categoryBtn} ${menuCategoryFilter === 'All' ? styles.categoryBtnActive : ''}`}
                      onClick={() => setMenuCategoryFilter('All')}
                    >
                      <span className={styles.categoryText}>All</span>
                      <span className={styles.categoryCount}>{menuItemsCounts.total}</span>
                    </button>
                    {menuCategoriesLoading ? (
                      <span style={{ fontSize: 12, opacity: 0.7 }}>Loading...</span>
                    ) : (
                      activeMenuCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`${styles.categoryBtn} ${menuCategoryFilter === cat.id ? styles.categoryBtnActive : ''}`}
                          onClick={() => setMenuCategoryFilter(cat.id)}
                        >
                          <span className={styles.categoryText}>{cat.name}</span>
                          <span className={styles.categoryCount}>{menuItemsCounts.catCounts[cat.id] || 0}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.resetBtn}
                  onClick={() => {
                    setMenuStatusFilter('All');
                    setMenuCategoryFilter('All');
                    setVegFilter('All');
                    setQuery('');
                  }}
                >
                  Reset Filter
                </button>
              </>
            )}

            {activeTab === 'Ingredients' && (
              <>
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
                </div>

                <button
                  type="button"
                  className={styles.resetBtn}
                  onClick={() => {
                    setStockFilter('All');
                    setCategoryFilter('All');
                    setQuery('');
                  }}
                >
                  ↻ Reset Filter
                </button>
              </>
            )}

            {activeTab === 'Request List' && (
              <>
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

                <button
                  type="button"
                  className={styles.resetBtn}
                  onClick={() => {
                    setStockFilter('All');
                    setQuery('');
                  }}
                >
                  ↻ Reset Filter
                </button>
              </>
            )}
          </aside>
        )}

        <section className={activeTab === 'Categories' || activeTab === 'Units' || activeTab === 'Suppliers' ? styles.contentCardFull : styles.contentCard}>
          <div className={styles.contentHeader}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              {activeTab !== 'Request List' && (
                <input
                  type="checkbox"
                  className={styles.selectAllCheckbox}
                  checked={
                    activeTab === 'Menu' ? (filteredMenuItems.length > 0 && Array.from(selectedItemIds).filter(id => filteredMenuItems.some(item => item.id === id)).length === filteredMenuItems.length) :
                      activeTab === 'Ingredients' ? (filteredIngredients.length > 0 && Array.from(selectedItemIds).filter(id => filteredIngredients.some(item => item.id === id)).length === filteredIngredients.length) :
                        activeTab === 'Categories' ? (filteredMenuCategories.length > 0 && Array.from(selectedItemIds).filter(id => filteredMenuCategories.some(item => item.id === id)).length === filteredMenuCategories.length) :
                          activeTab === 'Suppliers' ? (filteredSuppliers.length > 0 && Array.from(selectedItemIds).filter(id => filteredSuppliers.some(item => item.id === id)).length === filteredSuppliers.length) :
                            activeTab === 'Units' ? (units.length > 0 && Array.from(selectedItemIds).filter(id => units.some(item => item.id === id)).length === units.length) : false
                  }
                  onChange={() => {
                    const ids =
                      activeTab === 'Menu' ? filteredMenuItems.map(i => i.id) :
                        activeTab === 'Ingredients' ? filteredIngredients.map(i => i.id) :
                          activeTab === 'Categories' ? filteredMenuCategories.map(i => i.id) :
                            activeTab === 'Suppliers' ? filteredSuppliers.map(i => i.id) :
                              activeTab === 'Units' ? units.map(i => i.id) : [];
                    handleSelectAll(ids);
                  }}
                />
              )}
              <div className={styles.contentTitle}>
                {activeTab === 'Menu' ? 'Menu List' : activeTab === 'Ingredients' ? 'Ingredients List' : activeTab === 'Categories' ? 'Categories List' : activeTab === 'Units' ? 'Units of Measure' : activeTab === 'Suppliers' ? 'Suppliers List' : 'Request List'}
                {activeTab === 'Menu' && (
                  <span> ({filteredMenuItems.length})</span>
                )}
                {activeTab === 'Ingredients' && (
                  <span> ({filteredIngredients.length})</span>
                )}
                {activeTab === 'Categories' && (
                  <span> ({filteredMenuCategories.length})</span>
                )}
                {activeTab === 'Units' && (
                  <span> ({units.length})</span>
                )}
                {activeTab === 'Suppliers' && (
                  <span> ({filteredSuppliers.length})</span>
                )}
                {activeTab === 'Request List' && (
                  <span> ({filteredSuppliers.length})</span>
                )}
              </div>
            </div>
            {selectedItemIds.size > 0 && (
              <button
                type="button"
                className={styles.bulkDeleteBtn}
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? 'Deleting...' : `Delete Selected (${selectedItemIds.size})`}
              </button>
            )}
          </div>
          {activeTab === 'Menu' && (
            <div className={styles.dishGrid}>
              {menuItemsLoading && <div className={styles.loadingText}>Loading menu items...</div>}
              {menuItemsError && <div className={styles.errorText}>{menuItemsError}</div>}
              {!menuItemsLoading && !menuItemsError && filteredMenuItems.length === 0 && (
                <div className={styles.emptyText}>No menu items found. Add one to get started.</div>
              )}
              {!menuItemsLoading && !menuItemsError && filteredMenuItems.map((item) => (
                <div key={item.id} className={styles.dishCard}>
                  <div className={styles.dishSelectionOverlay}>
                    <input
                      type="checkbox"
                      checked={selectedItemIds.has(item.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleItemSelection(item.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className={styles.dishImageWrap}>
                    {item.images.length > 0 ? (
                      <Image
                        className={styles.dishImg}
                        src={getImageUrl(item.images.find((img) => img.isPrimary)?.imageUrl || item.images[0]?.imageUrl) || getImageUrl(item.primaryImageUrl) || ''}
                        alt={item.name}
                        fill
                        sizes="(max-width: 1100px) 50vw, 33vw"
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(243, 244, 246, 1)',
                          color: 'rgba(156, 163, 175, 1)',
                          fontSize: '32px',
                        }}
                      >
                        🍽️
                      </div>
                    )}
                    <div className={styles.availablePill}>
                      {item.isVeg ? <VegIcon /> : <NonVegIcon />}
                      {item.isVeg ? 'Veg' : 'Non-Veg'}
                    </div>
                  </div>
                  <div className={styles.dishBody}>
                    <div className={styles.dishName}>{item.name}</div>
                    <div className={styles.dishCategory}>{item.categoryName || 'Uncategorized'}</div>
                    <div className={styles.dishFooter}>
                      <div className={styles.canServe}>₹{item.basePrice.toFixed(2)}</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className={styles.editBtn}
                          onClick={() => openEditMenuItem(item)}
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteMenuItem(item.id)}
                          disabled={deletingMenuItemId === item.id}
                          title="Delete"
                        >
                          {deletingMenuItemId === item.id ? '...' : <TrashIcon />}
                        </button>
                      </div>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <span
                        className={item.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}
                        style={{ fontSize: '12px' }}
                      >
                        {item.status === 'ACTIVE' ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
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
                      <input
                        type="checkbox"
                        checked={selectedItemIds.has(i.id)}
                        onChange={() => toggleItemSelection(i.id)}
                        className={styles.rowCheckbox}
                      />
                      {i.imageUrl ? (
                        <img className={styles.ingImg} src={i.imageUrl} alt={i.name} loading="lazy" />
                      ) : (
                        <div className={styles.ingImg} style={{ background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
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
                    <input
                      type="checkbox"
                      checked={selectedItemIds.has(cat.id)}
                      onChange={() => toggleItemSelection(cat.id)}
                      className={styles.rowCheckbox}
                    />
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
                      <input
                        type="checkbox"
                        checked={selectedItemIds.has(unit.id)}
                        onChange={() => toggleItemSelection(unit.id)}
                        className={styles.rowCheckbox}
                      />
                      <div className={styles.categoryMgmtIcon}>📏</div>
                      <div>
                        <div className={styles.categoryMgmtName}>{unit.name} <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>({unit.abbreviation})</span></div>
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

          {activeTab === 'Suppliers' && (
            <div className={styles.categoryMgmtList}>
              {suppliersLoading && <div className={styles.loadingText}>Loading suppliers...</div>}
              {suppliersError && <div className={styles.errorText}>{suppliersError}</div>}
              {!suppliersLoading && !suppliersError && filteredSuppliers.length === 0 && (
                <div className={styles.emptyText}>No suppliers found. Add one to get started.</div>
              )}
              {!suppliersLoading && !suppliersError && filteredSuppliers.map((supplier) => (
                <div key={supplier.id} className={styles.categoryMgmtRow}>
                  <div className={styles.categoryMgmtLeft}>
                    <input
                      type="checkbox"
                      checked={selectedItemIds.has(supplier.id)}
                      onChange={() => toggleItemSelection(supplier.id)}
                      className={styles.rowCheckbox}
                    />
                    <div className={styles.categoryMgmtIcon}>🏢</div>
                    <div>
                      <div className={styles.categoryMgmtName}>{supplier.name}</div>
                      <div className={styles.categoryMgmtMeta}>
                        {supplier.contactPerson && <span>Contact: {supplier.contactPerson} · </span>}
                        {supplier.phone && <span>{supplier.phone} · </span>}
                        {supplier.email && <span>{supplier.email} · </span>}
                        Status: <span className={supplier.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}>{supplier.status}</span>
                      </div>
                      {supplier.address && (
                        <div className={styles.categoryMgmtMeta} style={{ marginTop: 2 }}>
                          📍 {supplier.address}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.categoryMgmtActions}>
                    <button type="button" className={styles.editBtn} onClick={() => openEditSupplier(supplier)} aria-label="Edit">
                      <EditIcon />
                    </button>
                    <button type="button" className={styles.deleteBtn} onClick={() => handleDeleteSupplier(supplier.id)} disabled={deletingSupplierId === supplier.id} aria-label="Delete">
                      {deletingSupplierId === supplier.id ? '...' : <TrashIcon />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Request List' && (
            <div style={{ padding: 16, color: 'var(--text-secondary)' }}>
              Request List UI not implemented yet.
            </div>
          )}
        </section>
      </div>

      {/* Add/Edit Modal */}
      {isMenuItemModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsMenuItemModalOpen(false)}>
          <div className={styles.categoryModal} style={{ width: 'min(600px, 92vw)' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTop}>
              <div className={styles.modalTitle}>
                {editingMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </div>
              <button
                type="button"
                className={styles.iconClose}
                onClick={() => setIsMenuItemModalOpen(false)}
              >
                <XIcon />
              </button>
            </div>
            <div className={styles.categoryModalBody}>
              <div className={styles.formStack}>
                {/* Name */}
                <div className={styles.field}>
                  <label className={styles.label}>Name *</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={menuItemForm.name}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })}
                    placeholder="Enter item name"
                  />
                </div>

                {/* Description */}
                <div className={styles.field}>
                  <label className={styles.label}>Description</label>
                  <textarea
                    className={styles.textarea}
                    value={menuItemForm.description || ''}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, description: e.target.value })}
                    placeholder="Enter item description"
                    style={{ minHeight: '80px' }}
                  />
                </div>

                {/* Category */}
                <div className={styles.field}>
                  <label className={styles.label}>Category</label>
                  <select
                    className={styles.input}
                    value={menuItemForm.categoryId || ''}
                    onChange={(e) =>
                      setMenuItemForm({ ...menuItemForm, categoryId: e.target.value || '' })
                    }
                  >
                    <option value="">-- No Category --</option>
                    {activeMenuCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div className={styles.field}>
                  <label className={styles.label}>Base Price (₹) *</label>
                  <div className={styles.priceWrap}>
                    <span className={styles.pricePrefix}>₹</span>
                    <input
                      type="number"
                      className={styles.priceInput}
                      value={menuItemForm.basePrice}
                      onChange={(e) =>
                        setMenuItemForm({ ...menuItemForm, basePrice: parseFloat(e.target.value) || 0 })
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Veg/Non-Veg */}
                <div className={styles.field}>
                  <label className={styles.label}>Type</label>
                  <div className={styles.pillsRow}>
                    <button
                      type="button"
                      className={`${styles.categoryPill} ${menuItemForm.isVeg ? styles.categoryPillActive : ''}`}
                      onClick={() => setMenuItemForm({ ...menuItemForm, isVeg: true })}
                    >
                      <VegIcon /> Veg
                    </button>
                    <button
                      type="button"
                      className={`${styles.categoryPill} ${!menuItemForm.isVeg ? styles.categoryPillActive : ''}`}
                      onClick={() => setMenuItemForm({ ...menuItemForm, isVeg: false })}
                    >
                      <NonVegIcon /> Non-Veg
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className={styles.field}>
                  <label className={styles.label}>Status</label>
                  <div className={styles.pillsRow}>
                    <button
                      type="button"
                      className={`${styles.categoryPill} ${menuItemForm.status === 'ACTIVE' ? styles.categoryPillActive : ''}`}
                      onClick={() => setMenuItemForm({ ...menuItemForm, status: 'ACTIVE' })}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      className={`${styles.categoryPill} ${menuItemForm.status === 'INACTIVE' ? styles.categoryPillActive : ''}`}
                      onClick={() => setMenuItemForm({ ...menuItemForm, status: 'INACTIVE' })}
                    >
                      Inactive
                    </button>
                  </div>
                </div>

                {/* Images */}
                <div className={styles.field}>
                  <label className={styles.label}>Images</label>

                  {/* Image Upload Dropbox */}
                  <div style={{ marginBottom: '16px' }}>
                    <ImageUploadDropbox
                      onUpload={handleImageUpload}
                      disabled={menuItemSubmitting}
                      maxSizeMB={5}
                    />
                  </div>

                  {/* Image URL Input (existing functionality) */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      className={styles.input}
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="Or enter image URL"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className={styles.addBtn}
                      onClick={addImage}
                      style={{ height: '40px', padding: '0 14px' }}
                    >
                      Add URL
                    </button>
                  </div>
                  {(menuItemForm.images?.length || 0) > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {menuItemForm.images?.map((img, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: 'relative',
                            width: '80px',
                            height: '80px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: img.isPrimary
                              ? '3px solid rgba(57, 107, 251, 1)'
                              : '1px solid rgba(0,0,0,0.1)',
                          }}
                        >
                          <Image
                            src={getImageUrl(img.imageUrl) || ''}
                            alt={`Image ${idx + 1}`}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              display: 'flex',
                              gap: '2px',
                            }}
                          >
                            {!img.isPrimary && (
                              <button
                                type="button"
                                onClick={() => setPrimaryImage(idx)}
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '0 0 0 6px',
                                  background: 'rgba(57, 107, 251, 0.9)',
                                  color: 'white',
                                  fontSize: '10px',
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                                title="Set as primary"
                              >
                                ★
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: img.isPrimary ? '0 0 0 6px' : '0',
                                background: 'rgba(239, 68, 68, 0.9)',
                                color: 'white',
                                fontSize: '12px',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                              title="Remove"
                            >
                              ×
                            </button>
                          </div>
                          {img.isPrimary && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: 'rgba(57, 107, 251, 0.9)',
                                color: 'white',
                                fontSize: '9px',
                                textAlign: 'center',
                                padding: '2px',
                              }}
                            >
                              Primary
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recipe */}
                <div className={styles.field}>
                  <RecipeManager
                    outletId={selectedOutletId || ''}
                    menuItemId={editingMenuItem?.id || null}
                    disabled={menuItemSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter} style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '0 20px 20px' }}>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={() => setIsMenuItemModalOpen(false)}
                style={{ width: 'auto', marginTop: 0 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleMenuItemSubmit}
                disabled={menuItemSubmitting || !menuItemForm.name.trim()}
              >
                {menuItemSubmitting ? 'Saving...' : editingMenuItem ? 'Update Item' : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div className={`${styles.stepRow} ${ingredientStep === 1 ? styles.stepRowActive : ''}`}>
                  <span className={`${styles.stepDot} ${ingredientStep === 1 ? styles.stepDotActive : styles.stepDotDone}`}>1</span>
                  <span className={styles.stepText}>Basic Info</span>
                </div>
                <div className={`${styles.stepRow} ${ingredientStep === 2 ? styles.stepRowActive : ''}`}>
                  <span className={`${styles.stepDot} ${ingredientStep === 2 ? styles.stepDotActive : ''}`}>2</span>
                  <span className={styles.stepText}>Inventory</span>
                </div>
                <div className={`${styles.stepRow} ${ingredientStep === 3 ? styles.stepRowActive : ''}`}>
                  <span className={`${styles.stepDot} ${ingredientStep === 3 ? styles.stepDotActive : ''}`}>3</span>
                  <span className={styles.stepText}>Pricing</span>
                </div>
              </div>
              <div className={styles.modalContent}>
                {ingredientStep === 1 && (
                  <>
                    <div className={styles.panelTitle}>Ingredient Information</div>
                    <div className={styles.formStack}>
                      <div className={styles.field}>
                        <div className={styles.label}>Name *</div>
                        <input className={styles.input} placeholder="Enter ingredient name" value={ingredientExtendedForm.name} onChange={(e) => setIngredientExtendedForm((f) => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div className={styles.field}>
                        <div className={styles.label}>Unit *</div>
                        <select className={styles.input} value={ingredientExtendedForm.unitId} onChange={(e) => setIngredientExtendedForm((f) => ({ ...f, unitId: e.target.value }))}>
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
                        <div className={styles.label}>Description</div>
                        <textarea className={styles.textarea} placeholder="Enter description" value={ingredientExtendedForm.description || ''} onChange={(e) => setIngredientExtendedForm((f) => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div className={styles.field}>
                        <div className={styles.label}>SKU</div>
                        <input className={styles.input} placeholder="Enter SKU" value={ingredientExtendedForm.sku || ''} onChange={(e) => setIngredientExtendedForm((f) => ({ ...f, sku: e.target.value }))} />
                      </div>
                      <div className={styles.field}>
                        <div className={styles.label}>Category</div>
                        <select className={styles.input} value={ingredientExtendedForm.categoryId || ''} onChange={(e) => setIngredientExtendedForm((f) => ({ ...f, categoryId: e.target.value }))}>
                          <option value="">-- Select Category --</option>
                          {ingredientCategoriesLoading ? (
                            <option disabled>Loading...</option>
                          ) : (
                            activeIngredientCategories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))
                          )}
                        </select>
                      </div>
                      <div className={styles.field}>
                        <div className={styles.label}>Image URL</div>
                        <input className={styles.input} placeholder="Enter image URL" value={ingredientExtendedForm.imageUrl || ''} onChange={(e) => setIngredientExtendedForm((f) => ({ ...f, imageUrl: e.target.value }))} />
                      </div>
                    </div>
                    <div className={styles.modalFooter}>
                      <button type="button" className={styles.primaryBtn} onClick={() => setIngredientStep(2)}>Next</button>
                    </div>
                  </>
                )}
                {ingredientStep === 2 && (
                  <>
                    <div className={styles.panelTitle}>Inventory Information</div>
                    <div className={styles.formStack}>
                      <div className={styles.field}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="checkbox" checked={ingredientExtendedForm.trackInventory !== false} onChange={(e) => setIngredientExtendedForm((f) => ({ ...f, trackInventory: e.target.checked }))} />
                          <span className={styles.label} style={{ marginBottom: 0 }}>Track Inventory</span>
                        </label>
                      </div>
                      {ingredientExtendedForm.trackInventory !== false && (
                        <>
                          <div className={styles.field}>
                            <div className={styles.label}>Initial Stock</div>
                            <input className={styles.input} type="number" step="0.01" value={ingredientExtendedForm.currentStock || ''} onChange={(e) => setIngredientExtendedForm((f) => ({ ...f, currentStock: parseFloat(e.target.value) || 0 }))} />
                          </div>
                          <div className={styles.field}>
                            <div className={styles.label}>Reorder Level</div>
                            <input className={styles.input} type="number" step="0.01" value={ingredientExtendedForm.reorderLevel || ''} onChange={(e) => setIngredientExtendedForm((f) => ({ ...f, reorderLevel: parseFloat(e.target.value) || undefined }))} />
                          </div>
                          <div className={styles.field}>
                            <div className={styles.label}>Reorder Quantity</div>
                            <input className={styles.input} type="number" step="0.01" value={ingredientExtendedForm.reorderQuantity || ''} onChange={(e) => setIngredientExtendedForm((f) => ({ ...f, reorderQuantity: parseFloat(e.target.value) || undefined }))} />
                          </div>
                          <div className={styles.field}>
                            <div className={styles.label}>Max Stock Level</div>
                            <input className={styles.input} type="number" step="0.01" value={ingredientExtendedForm.maxStockLevel || ''} onChange={(e) => setIngredientExtendedForm((f) => ({ ...f, maxStockLevel: parseFloat(e.target.value) || undefined }))} />
                          </div>
                          <div className={styles.field}>
                            <div className={styles.label}>Shelf Life (days)</div>
                            <input className={styles.input} type="number" step="1" value={ingredientExtendedForm.shelfLifeDays || ''} onChange={(e) => setIngredientExtendedForm((f) => ({ ...f, shelfLifeDays: parseInt(e.target.value, 10) || undefined }))} />
                          </div>
                          <div className={styles.field}>
                            <div className={styles.label}>Storage Instructions</div>
                            <textarea className={styles.textarea} placeholder="Enter storage instructions" value={ingredientExtendedForm.storageInstructions || ''} onChange={(e) => setIngredientExtendedForm((f) => ({ ...f, storageInstructions: e.target.value }))} />
                          </div>
                          <div className={styles.field}>
                            <div className={styles.label}>Default Supplier</div>
                            <select className={styles.input} value={ingredientExtendedForm.defaultSupplierId || ''} onChange={(e) => setIngredientExtendedForm((f) => ({ ...f, defaultSupplierId: e.target.value }))}>
                              <option value="">-- Select Supplier --</option>
                              {suppliersLoading ? (
                                <option disabled>Loading...</option>
                              ) : (
                                suppliers.map((s) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))
                              )}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                    <div className={styles.modalFooter}>
                      <button type="button" className={styles.primaryBtn} onClick={() => setIngredientStep(3)}>Next</button>
                    </div>
                  </>
                )}
                {ingredientStep === 3 && (
                  <>
                    <div className={styles.panelTitle}>Pricing Information</div>
                    <div className={styles.formStack}>
                      <div className={styles.field}>
                        <div className={styles.label}>Cost Price *</div>
                        <div className={styles.priceWrap}>
                          <div className={styles.pricePrefix}>$</div>
                          <input className={styles.priceInput} type="number" step="0.01" value={ingredientExtendedForm.costPrice} onChange={(e) => setIngredientExtendedForm((f) => ({ ...f, costPrice: parseFloat(e.target.value) || 0 }))} />
                        </div>
                      </div>
                      <div className={styles.field}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="checkbox" checked={ingredientExtendedForm.isSellable} onChange={(e) => setIngredientExtendedForm((f) => ({ ...f, isSellable: e.target.checked }))} />
                          <span className={styles.label} style={{ marginBottom: 0 }}>Sellable</span>
                        </label>
                      </div>
                      {ingredientExtendedForm.isSellable && (
                        <div className={styles.field}>
                          <div className={styles.label}>Selling Price</div>
                          <div className={styles.priceWrap}>
                            <div className={styles.pricePrefix}>$</div>
                            <input className={styles.priceInput} type="number" step="0.01" value={ingredientExtendedForm.sellingPrice || ''} onChange={(e) => setIngredientExtendedForm((f) => ({ ...f, sellingPrice: parseFloat(e.target.value) || undefined }))} />
                          </div>
                        </div>
                      )}
                      <div className={styles.field}>
                        <div className={styles.label}>Status</div>
                        <div className={styles.pillsRow}>
                          {(['ACTIVE', 'INACTIVE'] as const).map((s) => (
                            <button key={s} type="button" className={`${styles.categoryPill} ${ingredientExtendedForm.status === s ? styles.categoryPillActive : ''}`} onClick={() => setIngredientExtendedForm((f) => ({ ...f, status: s }))}>{s}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={styles.modalFooter}>
                      <button type="button" className={styles.primaryBtn} onClick={handleIngredientSubmit} disabled={ingredientSubmitting || !ingredientExtendedForm.name.trim() || !ingredientExtendedForm.unitId}>
                        {ingredientSubmitting ? 'Saving...' : editingIngredient ? 'Update Ingredient' : 'Create Ingredient'}
                      </button>
                    </div>
                  </>
                )}
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
              <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 12 }}>
                <strong>{selectedIngredient.name}</strong>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
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

      {/* Supplier Modal */}
      {isSupplierModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsSupplierModalOpen(false); }}>
          <div className={styles.categoryModal} style={{ maxWidth: 520 }}>
            <div className={styles.modalTop}>
              <div className={styles.modalTitle}>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</div>
              <button type="button" className={styles.iconClose} onClick={() => setIsSupplierModalOpen(false)} aria-label="Close"><XIcon /></button>
            </div>
            <div className={styles.categoryModalBody}>
              <div className={styles.field}>
                <div className={styles.label}>Supplier Name *</div>
                <input className={styles.input} placeholder="Enter supplier name" value={supplierForm.name} onChange={(e) => setSupplierForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <div className={styles.label}>Contact Person</div>
                <input className={styles.input} placeholder="Enter contact person name" value={supplierForm.contactPerson || ''} onChange={(e) => setSupplierForm((f) => ({ ...f, contactPerson: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className={styles.field}>
                  <div className={styles.label}>Email</div>
                  <input className={styles.input} type="email" placeholder="email@example.com" value={supplierForm.email || ''} onChange={(e) => setSupplierForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <div className={styles.label}>Phone</div>
                  <input className={styles.input} type="tel" placeholder="+1 234 567 8900" value={supplierForm.phone || ''} onChange={(e) => setSupplierForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className={styles.field}>
                <div className={styles.label}>Address</div>
                <textarea className={styles.textarea} placeholder="Enter supplier address" value={supplierForm.address || ''} onChange={(e) => setSupplierForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <div className={styles.label}>Notes</div>
                <textarea className={styles.textarea} placeholder="Additional notes about the supplier" value={supplierForm.notes || ''} onChange={(e) => setSupplierForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <div className={styles.label}>Status</div>
                <div className={styles.pillsRow}>
                  {(['ACTIVE', 'INACTIVE'] as const).map((s) => (
                    <button key={s} type="button" className={`${styles.categoryPill} ${supplierForm.status === s ? styles.categoryPillActive : ''}`} onClick={() => setSupplierForm((f) => ({ ...f, status: s }))}>{s}</button>
                  ))}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.primaryBtn} onClick={handleSupplierSubmit} disabled={supplierSubmitting || !supplierForm.name.trim()}>
                  {supplierSubmitting ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                </button>
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
        d="M8 6V4C8 3.46957 8 2.96086 8 2.58579C8 2.21071 8 2.46957 8 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg >
  );
}
