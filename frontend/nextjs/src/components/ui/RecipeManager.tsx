'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  getMenuItemRecipes,
  upsertMenuItemRecipes,
  listIngredients,
  listUnitsOfMeasure,
  type MenuItemRecipeResponse,
  type MenuItemRecipeUpsertInput,
  type IngredientResponse,
  type UnitOfMeasureResponse,
} from '@/lib/api/clientAdmin';
import styles from '@/app/(client-admin)/client-admin/inventory/Inventory.module.css';

interface RecipeManagerProps {
  readonly outletId: string;
  readonly menuItemId: string | null;
  readonly disabled?: boolean;
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function RecipeManager({ outletId, menuItemId, disabled = false }: RecipeManagerProps) {
  const [recipes, setRecipes] = useState<MenuItemRecipeResponse[]>([]);
  const [ingredients, setIngredients] = useState<IngredientResponse[]>([]);
  const [units, setUnits] = useState<UnitOfMeasureResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [ingredientSearch, setIngredientSearch] = useState<string>('');

  // Load recipes and ingredients/units
  useEffect(() => {
    if (!outletId || !menuItemId) {
      setRecipes([]);
      return;
    }

    setLoading(true);
    setError(null);
    Promise.all([
      getMenuItemRecipes(outletId, menuItemId).catch(() => []),
      listIngredients(outletId).catch(() => []),
      listUnitsOfMeasure(outletId).catch(() => []),
    ])
      .then(([recipesData, ingredientsData, unitsData]) => {
        setRecipes(recipesData || []);
        setIngredients(ingredientsData || []);
        setUnits(unitsData || []);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load recipes');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [outletId, menuItemId]);

  // Filter ingredients by search
  const filteredIngredients = useMemo(() => {
    if (!ingredientSearch.trim()) return ingredients;
    const search = ingredientSearch.toLowerCase();
    return ingredients.filter(ing => 
      ing.name.toLowerCase().includes(search) ||
      ing.sku?.toLowerCase().includes(search)
    );
  }, [ingredients, ingredientSearch]);

  const handleAddRecipe = () => {
    if (!filteredIngredients.length || !units.length) return;

    const newRecipe: MenuItemRecipeUpsertInput = {
      ingredientId: filteredIngredients[0].id,
      quantity: 1,
      unitId: units[0].id,
      notes: '',
      isOptional: false,
      sortOrder: recipes.length,
    };

    const ingredient = filteredIngredients[0];
    const unit = units[0];

    setRecipes([...recipes, {
      id: `temp-${Date.now()}`,
      menuItemId: menuItemId || '',
      ingredientId: newRecipe.ingredientId,
      ingredientName: ingredient.name,
      unitId: newRecipe.unitId,
      unitName: unit.name,
      unitAbbreviation: unit.abbreviation,
      quantity: newRecipe.quantity,
      notes: newRecipe.notes,
      isOptional: newRecipe.isOptional,
      sortOrder: newRecipe.sortOrder,
    }]);
    
    setIngredientSearch(''); // Clear search after adding
  };

  const handleRemoveRecipe = (index: number) => {
    const newRecipes = recipes.filter((_, i) => i !== index);
    // Update sort orders
    const updatedRecipes = newRecipes.map((r, i) => ({ ...r, sortOrder: i }));
    setRecipes(updatedRecipes);
  };

  const handleUpdateRecipe = (index: number, field: keyof MenuItemRecipeResponse, value: any) => {
    const newRecipes = [...recipes];
    (newRecipes[index] as any)[field] = value;
    
    // Update ingredient/unit names when IDs change
    if (field === 'ingredientId') {
      const ingredient = ingredients.find(i => i.id === value);
      if (ingredient) {
        newRecipes[index].ingredientName = ingredient.name;
      }
    }
    if (field === 'unitId') {
      const unit = units.find(u => u.id === value);
      if (unit) {
        newRecipes[index].unitName = unit.name;
        newRecipes[index].unitAbbreviation = unit.abbreviation;
      }
    }
    
    setRecipes(newRecipes);
    setSuccessMessage(null); // Clear success message on edit
  };

  const handleSave = async () => {
    if (!outletId || !menuItemId) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const recipesToSave: MenuItemRecipeUpsertInput[] = recipes.map((r, index) => ({
        ingredientId: r.ingredientId,
        quantity: r.quantity,
        unitId: r.unitId,
        notes: r.notes || null,
        isOptional: r.isOptional,
        sortOrder: index,
      }));

      const savedRecipes = await upsertMenuItemRecipes(outletId, menuItemId, recipesToSave);
      setRecipes(savedRecipes);
      setSuccessMessage('Recipe saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save recipes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.field}>
        <label className={styles.label}>Recipe Ingredients</label>
        <div style={{ padding: '40px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
          Loading recipe ingredients...
        </div>
      </div>
    );
  }

  const hasChanges = recipes.length > 0 && !disabled;

  return (
    <div className={styles.field}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <label className={styles.label} style={{ marginBottom: 0 }}>Recipe Ingredients</label>
        {!disabled && (
          <button
            type="button"
            onClick={handleAddRecipe}
            disabled={!filteredIngredients.length || !units.length}
            className={styles.addBtn}
            style={{ 
              height: '36px', 
              padding: '0 12px',
              fontSize: '13px',
              opacity: (!filteredIngredients.length || !units.length) ? 0.5 : 1,
            }}
          >
            <PlusIcon />
            Add Ingredient
          </button>
        )}
      </div>

      {error && (
        <div style={{
          padding: '10px 14px',
          marginBottom: '12px',
          background: 'rgba(254, 242, 242, 1)',
          color: 'rgba(220, 38, 38, 1)',
          borderRadius: '8px',
          fontSize: '13px',
          border: '1px solid rgba(220, 38, 38, 0.2)',
        }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          padding: '10px 14px',
          marginBottom: '12px',
          background: 'rgba(236, 253, 245, 1)',
          color: 'rgba(16, 185, 129, 1)',
          borderRadius: '8px',
          fontSize: '13px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckIcon />
          {successMessage}
        </div>
      )}

      {recipes.length === 0 ? (
        <div style={{
          padding: '40px 24px',
          textAlign: 'center',
          background: 'rgba(249, 250, 251, 1)',
          borderRadius: '12px',
          border: '1px dashed rgba(209, 213, 219, 1)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍳</div>
          <div style={{ color: 'rgba(107, 114, 128, 1)', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
            No ingredients added yet
          </div>
          <div style={{ color: 'rgba(156, 163, 175, 1)', fontSize: '12px' }}>
            Add ingredients to create a recipe for this menu item
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: hasChanges ? '16px' : '0' }}>
            {recipes.map((recipe, index) => {
              const ingredient = ingredients.find(i => i.id === recipe.ingredientId);
              const unit = units.find(u => u.id === recipe.unitId);
              
              return (
                <div
                  key={recipe.id}
                  style={{
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: `1px solid ${recipe.isOptional ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 0, 0, 0.08)'}`,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'start' }}>
                    {/* Left side - Form fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Ingredient selection */}
                      <div>
                        <label 
                          htmlFor={`recipe-ingredient-${index}`}
                          style={{ 
                            display: 'block', 
                            fontSize: '11px', 
                            fontWeight: '700', 
                            color: 'rgba(107, 114, 128, 1)',
                            marginBottom: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Ingredient
                        </label>
                        <select
                          id={`recipe-ingredient-${index}`}
                          value={recipe.ingredientId}
                          onChange={(e) => handleUpdateRecipe(index, 'ingredientId', e.target.value)}
                          disabled={disabled}
                          className={styles.input}
                          style={{ width: '100%' }}
                        >
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} {ing.sku ? `(${ing.sku})` : ''}
                            </option>
                          ))}
                        </select>
                        {ingredient && (
                          <div style={{ 
                            marginTop: '4px', 
                            fontSize: '11px', 
                            color: 'rgba(156, 163, 175, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}>
                            {ingredient.trackInventory && (
                              <span>
                                Stock: {ingredient.currentStock.toFixed(2)} {unit?.abbreviation || ''}
                              </span>
                            )}
                            {ingredient.categoryName && (
                              <span>• {ingredient.categoryName}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quantity and Unit */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '10px' }}>
                        <div>
                          <label 
                            htmlFor={`recipe-quantity-${index}`}
                            style={{ 
                              display: 'block', 
                              fontSize: '11px', 
                              fontWeight: '700', 
                              color: 'rgba(107, 114, 128, 1)',
                              marginBottom: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            Quantity
                          </label>
                          <input
                            id={`recipe-quantity-${index}`}
                            type="number"
                            value={recipe.quantity}
                            onChange={(e) => handleUpdateRecipe(index, 'quantity', Number.parseFloat(e.target.value) || 0)}
                            disabled={disabled}
                            min="0"
                            step="0.01"
                            className={styles.input}
                            style={{ width: '100%' }}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label 
                            htmlFor={`recipe-unit-${index}`}
                            style={{ 
                              display: 'block', 
                              fontSize: '11px', 
                              fontWeight: '700', 
                              color: 'rgba(107, 114, 128, 1)',
                              marginBottom: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            Unit
                          </label>
                          <select
                            id={`recipe-unit-${index}`}
                            value={recipe.unitId}
                            onChange={(e) => handleUpdateRecipe(index, 'unitId', e.target.value)}
                            disabled={disabled}
                            className={styles.input}
                            style={{ width: '100%' }}
                          >
                            {units.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.abbreviation} - {u.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label 
                          htmlFor={`recipe-notes-${index}`}
                          style={{ 
                            display: 'block', 
                            fontSize: '11px', 
                            fontWeight: '700', 
                            color: 'rgba(107, 114, 128, 1)',
                            marginBottom: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Notes (Optional)
                        </label>
                        <input
                          id={`recipe-notes-${index}`}
                          type="text"
                          value={recipe.notes || ''}
                          onChange={(e) => handleUpdateRecipe(index, 'notes', e.target.value)}
                          disabled={disabled}
                          className={styles.input}
                          style={{ width: '100%' }}
                          placeholder="e.g., Fresh, chopped finely"
                        />
                      </div>

                      {/* Optional checkbox */}
                      <label 
                        htmlFor={`recipe-optional-${index}`}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          fontSize: '13px',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: recipe.isOptional ? 'rgba(245, 158, 11, 0.1)' : 'rgba(243, 244, 246, 1)',
                          border: `1px solid ${recipe.isOptional ? 'rgba(245, 158, 11, 0.3)' : 'rgba(209, 213, 219, 1)'}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        <input
                          id={`recipe-optional-${index}`}
                          type="checkbox"
                          checked={recipe.isOptional}
                          onChange={(e) => handleUpdateRecipe(index, 'isOptional', e.target.checked)}
                          disabled={disabled}
                          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                        />
                        <span style={{ fontWeight: '600', color: recipe.isOptional ? 'rgba(245, 158, 11, 1)' : 'rgba(107, 114, 128, 1)' }}>
                          Optional Ingredient
                        </span>
                        {recipe.isOptional ? (
                          <span style={{ fontSize: '11px', color: 'rgba(156, 163, 175, 1)', marginLeft: 'auto' }}>
                            (Will not deduct stock)
                          </span>
                        ) : null}
                      </label>
                    </div>

                    {/* Right side - Remove button */}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipe(index)}
                        style={{
                          width: '36px',
                          height: '36px',
                          padding: '0',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: 'rgba(239, 68, 68, 1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 1)';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                          e.currentTarget.style.color = 'rgba(239, 68, 68, 1)';
                        }}
                        aria-label="Remove ingredient"
                        title="Remove ingredient"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {hasChanges && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '12px 16px',
              background: 'rgba(249, 250, 251, 1)',
              borderRadius: '10px',
              border: '1px solid rgba(209, 213, 219, 1)',
            }}>
              <div style={{ fontSize: '13px', color: 'rgba(107, 114, 128, 1)' }}>
                {recipes.length} ingredient{recipes.length !== 1 ? 's' : ''} in recipe
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={styles.primaryBtn}
                style={{
                  height: '36px',
                  padding: '0 16px',
                  fontSize: '13px',
                  opacity: saving ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {saving ? (
                  <>
                    <span style={{ 
                      display: 'inline-block', 
                      width: '14px', 
                      height: '14px', 
                      border: '2px solid rgba(255,255,255,0.3)', 
                      borderTopColor: 'white', 
                      borderRadius: '50%', 
                      animation: 'spin 0.6s linear infinite' 
                    }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon />
                    Save Recipe
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
