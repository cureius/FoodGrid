// filepath: /Users/sourajp/FoodGrid/frontend/nextjs/src/app/(client-admin)/client-admin/inventory/menu/page.tsx
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from '../Inventory.module.css';
import {
  listMenuCategories,
  listMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItem,
  listOutlets,
  uploadMenuItemImage,
  getImageUrl,
  type MenuCategoryResponse,
  type MenuItemResponse,
  type MenuItemUpsertInput,
} from '@/lib/api/clientAdmin';
import ImageUploadDropbox from '@/components/ui/ImageUploadDropbox';

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

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function VegIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="2" stroke="#16a34a" strokeWidth="2"/>
      <circle cx="12" cy="12" r="5" fill="#16a34a"/>
    </svg>
  );
}

function NonVegIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="2" stroke="#dc2626" strokeWidth="2"/>
      <polygon points="12,7 17,17 7,17" fill="#dc2626"/>
    </svg>
  );
}

export default function MenuItemsPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [vegFilter, setVegFilter] = useState<'All' | 'Veg' | 'Non-Veg'>('All');

  // Outlet state
  const [outletId, setOutletId] = useState<string | null>(null);

  // Menu Categories
  const [menuCategories, setMenuCategories] = useState<MenuCategoryResponse[]>([]);
  const [menuCategoriesLoading, setMenuCategoriesLoading] = useState(false);

  // Menu Items
  const [menuItems, setMenuItems] = useState<MenuItemResponse[]>([]);
  const [menuItemsLoading, setMenuItemsLoading] = useState(false);
  const [menuItemsError, setMenuItemsError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemResponse | null>(null);
  const [itemForm, setItemForm] = useState<MenuItemUpsertInput>({
    name: '',
    description: '',
    categoryId: null,
    isVeg: false,
    basePrice: 0,
    status: 'ACTIVE',
    images: [],
  });
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Image URL input
  const [imageUrlInput, setImageUrlInput] = useState('');
  
  // Pending file uploads (files to be uploaded after menu item creation)
  const [pendingImageUploads, setPendingImageUploads] = useState<File[]>([]);

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
    try {
      const data = await listMenuCategories(outletId);
      setMenuCategories(data || []);
    } catch (err: any) {
      console.error('Failed to load categories', err);
    } finally {
      setMenuCategoriesLoading(false);
    }
  }, [outletId]);

  // Fetch menu items
  const fetchMenuItems = useCallback(async () => {
    if (!outletId) return;
    setMenuItemsLoading(true);
    setMenuItemsError(null);
    try {
      const data = await listMenuItems(outletId);
      setMenuItems(data || []);
    } catch (err: any) {
      setMenuItemsError(err?.message || 'Failed to load menu items');
    } finally {
      setMenuItemsLoading(false);
    }
  }, [outletId]);

  // Fetch data on mount
  useEffect(() => {
    if (outletId) {
      fetchMenuCategories();
      fetchMenuItems();
    }
  }, [outletId, fetchMenuCategories, fetchMenuItems]);

  const activeCategories = useMemo(() => {
    return menuCategories.filter((c) => c.status === 'ACTIVE');
  }, [menuCategories]);

  // Open add modal
  const openAddItem = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      description: '',
      categoryId: null,
      isVeg: false,
      basePrice: 0,
      status: 'ACTIVE',
      images: [],
    });
    setImageUrlInput('');
    setPendingImageUploads([]);
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditItem = (item: MenuItemResponse) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      categoryId: item.categoryId,
      isVeg: item.isVeg,
      basePrice: item.basePrice,
      status: item.status,
      images: item.images?.map((img) => ({
        imageUrl: img.imageUrl,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
      })) || [],
    });
    setImageUrlInput('');
    setPendingImageUploads([]);
    setIsModalOpen(true);
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!outletId || !itemForm.name.trim()) return;
    setItemSubmitting(true);
    try {
      // Filter out data URLs (preview URLs) from images when creating new item
      const imagesToSubmit = editingItem
        ? itemForm.images
        : itemForm.images?.filter((img) => !img.imageUrl.startsWith('data:'));

      const formDataToSubmit = {
        ...itemForm,
        images: imagesToSubmit,
      };

      let menuItemId: string;
      if (editingItem) {
        await updateMenuItem(outletId, editingItem.id, formDataToSubmit);
        menuItemId = editingItem.id;
      } else {
        const newItem = await createMenuItem(outletId, formDataToSubmit);
        menuItemId = newItem.id;
      }

      // Upload pending image files (for new items)
      if (pendingImageUploads.length > 0) {
        const existingImageCount = imagesToSubmit?.length || 0;
        for (let i = 0; i < pendingImageUploads.length; i++) {
          const file = pendingImageUploads[i];
          try {
            await uploadMenuItemImage(outletId, menuItemId, file, {
              isPrimary: existingImageCount === 0 && i === 0,
              sortOrder: existingImageCount + i,
            });
          } catch (err: any) {
            console.error('Failed to upload image:', err);
            // Continue with other uploads even if one fails
          }
        }
      }

      setIsModalOpen(false);
      fetchMenuItems();
    } catch (err: any) {
      alert(err?.message || 'Failed to save menu item');
    } finally {
      setItemSubmitting(false);
    }
  };

  // Handle image file upload
  const handleImageUpload = async (file: File): Promise<string> => {
    if (!outletId) {
      throw new Error('Outlet ID is required');
    }

    // If editing an existing item, upload immediately
    if (editingItem) {
      try {
        const currentImageCount = itemForm.images?.length || 0;
        const response = await uploadMenuItemImage(outletId, editingItem.id, file, {
          isPrimary: currentImageCount === 0,
          sortOrder: currentImageCount,
        });
        
        // Refresh menu item data to get updated images
        const updatedItem = await getMenuItem(outletId, editingItem.id);
        setItemForm({
          ...itemForm,
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
          const currentImageCount = itemForm.images?.length || 0;
          const newImages = [
            ...(itemForm.images || []),
            {
              imageUrl: previewUrl,
              sortOrder: currentImageCount,
              isPrimary: currentImageCount === 0,
            },
          ];
          setItemForm({ ...itemForm, images: newImages });
          resolve(previewUrl);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Handle delete
  const handleDelete = async (itemId: string) => {
    if (!outletId) return;
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    setDeletingItemId(itemId);
    try {
      await deleteMenuItem(outletId, itemId);
      fetchMenuItems();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete menu item');
    } finally {
      setDeletingItemId(null);
    }
  };

  // Add image to form
  const addImage = () => {
    if (!imageUrlInput.trim()) return;
    const newImages = [
      ...(itemForm.images || []),
      {
        imageUrl: imageUrlInput.trim(),
        sortOrder: (itemForm.images?.length || 0),
        isPrimary: (itemForm.images?.length || 0) === 0,
      },
    ];
    setItemForm({ ...itemForm, images: newImages });
    setImageUrlInput('');
  };

  // Remove image from form
  const removeImage = (index: number) => {
    const images = itemForm.images || [];
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
    setItemForm({ ...itemForm, images: newImages });
  };

  // Set primary image
  const setPrimaryImage = (index: number) => {
    const newImages = (itemForm.images || []).map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    setItemForm({ ...itemForm, images: newImages });
  };

  // Filter menu items
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menuItems
      .filter((item) => !q || item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q))
      .filter((item) => {
        if (statusFilter === 'All') return true;
        return statusFilter === 'Active' ? item.status === 'ACTIVE' : item.status === 'INACTIVE';
      })
      .filter((item) => {
        if (categoryFilter === 'All') return true;
        return item.categoryId === categoryFilter;
      })
      .filter((item) => {
        if (vegFilter === 'All') return true;
        return vegFilter === 'Veg' ? item.isVeg : !item.isVeg;
      });
  }, [menuItems, query, statusFilter, categoryFilter, vegFilter]);

  // Counts
  const counts = useMemo(() => {
    const total = menuItems.length;
    const active = menuItems.filter((i) => i.status === 'ACTIVE').length;
    const inactive = menuItems.filter((i) => i.status === 'INACTIVE').length;
    const veg = menuItems.filter((i) => i.isVeg).length;
    const nonVeg = menuItems.filter((i) => !i.isVeg).length;

    const catCounts: Record<string, number> = { All: total };
    activeCategories.forEach((cat) => {
      catCounts[cat.id] = menuItems.filter((i) => i.categoryId === cat.id).length;
    });

    return { total, active, inactive, veg, nonVeg, catCounts };
  }, [menuItems, activeCategories]);

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div className={styles.titlePill}>
          <span aria-hidden="true">🍽️</span>
          <span>Menu Items</span>
        </div>

        <div className={styles.headerMid}></div>

        <div className={styles.headerRight}>
          <div className={styles.searchWrap}>
            <SearchIcon />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Menu Items..."
            />
          </div>
          <button type="button" className={styles.addBtn} onClick={openAddItem}>
            <PlusIcon />
            Add Menu Item
          </button>
        </div>
      </div>

      <div className={styles.shell}>
        <aside className={styles.filterCard}>
          <div className={styles.filterTitle}>Filter</div>

          {/* Status Filter */}
          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>STATUS</div>
            <div className={styles.chipsWrap}>
              {(['All', 'Active', 'Inactive'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`${styles.chip} ${statusFilter === s ? styles.chipActive : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                  <span className={styles.badgeCount}>
                    {s === 'All' ? counts.total : s === 'Active' ? counts.active : counts.inactive}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Veg/Non-Veg Filter */}
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
                    {v === 'All' ? counts.total : v === 'Veg' ? counts.veg : counts.nonVeg}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>CATEGORY</div>
            <div className={styles.categoryList}>
              <button
                type="button"
                className={`${styles.categoryBtn} ${categoryFilter === 'All' ? styles.categoryBtnActive : ''}`}
                onClick={() => setCategoryFilter('All')}
              >
                <span className={styles.categoryText}>All Categories</span>
                <span className={styles.categoryCount}>{counts.total}</span>
              </button>
              {activeCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`${styles.categoryBtn} ${categoryFilter === cat.id ? styles.categoryBtnActive : ''}`}
                  onClick={() => setCategoryFilter(cat.id)}
                >
                  <span className={styles.categoryText}>{cat.name}</span>
                  <span className={styles.categoryCount}>{counts.catCounts[cat.id] || 0}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => {
              setStatusFilter('All');
              setCategoryFilter('All');
              setVegFilter('All');
              setQuery('');
            }}
          >
            Reset Filter
          </button>
        </aside>

        <div className={styles.contentCard}>
          <div className={styles.contentHeader}>
            <div className={styles.contentTitle}>
              Menu Items ({filteredItems.length})
            </div>
          </div>

          {menuItemsLoading ? (
            <div className={styles.loadingText}>Loading menu items...</div>
          ) : menuItemsError ? (
            <div className={styles.errorText}>{menuItemsError}</div>
          ) : filteredItems.length === 0 ? (
            <div className={styles.emptyText}>No menu items found. Add your first menu item!</div>
          ) : (
            <div className={styles.dishGrid}>
              {filteredItems.map((item) => (
                <div key={item.id} className={styles.dishCard}>
                  <div className={styles.dishImageWrap}>
                    {item.primaryImageUrl ? (
                      <Image
                        src={getImageUrl(item.primaryImageUrl) || ''}
                        alt={item.name}
                        fill
                        className={styles.dishImg}
                        style={{ objectFit: 'cover' }}
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
                    <div className={styles.dishCategory}>
                      {item.categoryName || 'Uncategorized'}
                    </div>
                    <div className={styles.dishFooter}>
                      <div className={styles.canServe}>
                        ₹{item.basePrice.toFixed(2)}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className={styles.editBtn}
                          onClick={() => openEditItem(item)}
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingItemId === item.id}
                          title="Delete"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <span
                        className={
                          item.status === 'ACTIVE'
                            ? styles.statusActive
                            : styles.statusInactive
                        }
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
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.categoryModal} style={{ width: 'min(600px, 92vw)' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTop}>
              <div className={styles.modalTitle}>
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </div>
              <button
                type="button"
                className={styles.iconClose}
                onClick={() => setIsModalOpen(false)}
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
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="Enter item name"
                  />
                </div>

                {/* Description */}
                <div className={styles.field}>
                  <label className={styles.label}>Description</label>
                  <textarea
                    className={styles.textarea}
                    value={itemForm.description || ''}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    placeholder="Enter item description"
                    style={{ minHeight: '80px' }}
                  />
                </div>

                {/* Category */}
                <div className={styles.field}>
                  <label className={styles.label}>Category</label>
                  <select
                    className={styles.input}
                    value={itemForm.categoryId || ''}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, categoryId: e.target.value || null })
                    }
                  >
                    <option value="">-- No Category --</option>
                    {activeCategories.map((cat) => (
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
                      value={itemForm.basePrice}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, basePrice: parseFloat(e.target.value) || 0 })
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
                      className={`${styles.categoryPill} ${itemForm.isVeg ? styles.categoryPillActive : ''}`}
                      onClick={() => setItemForm({ ...itemForm, isVeg: true })}
                    >
                      <VegIcon /> Veg
                    </button>
                    <button
                      type="button"
                      className={`${styles.categoryPill} ${!itemForm.isVeg ? styles.categoryPillActive : ''}`}
                      onClick={() => setItemForm({ ...itemForm, isVeg: false })}
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
                      className={`${styles.categoryPill} ${itemForm.status === 'ACTIVE' ? styles.categoryPillActive : ''}`}
                      onClick={() => setItemForm({ ...itemForm, status: 'ACTIVE' })}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      className={`${styles.categoryPill} ${itemForm.status === 'INACTIVE' ? styles.categoryPillActive : ''}`}
                      onClick={() => setItemForm({ ...itemForm, status: 'INACTIVE' })}
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
                      disabled={itemSubmitting}
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
                  {(itemForm.images?.length || 0) > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {itemForm.images?.map((img, idx) => (
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
              </div>

              <div className={styles.modalFooter} style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className={styles.resetBtn}
                  onClick={() => setIsModalOpen(false)}
                  style={{ width: 'auto', marginTop: 0 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleSubmit}
                  disabled={itemSubmitting || !itemForm.name.trim()}
                >
                  {itemSubmitting ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
