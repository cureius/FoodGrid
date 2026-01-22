'use client';

import { useState, useEffect } from 'react';
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

interface RecipeManagerProps {
  readonly outletId: string;
  readonly menuItemId: string | null;
  readonly disabled?: boolean;
}

export default function RecipeManager({ outletId, menuItemId, disabled = false }: RecipeManagerProps) {
  const [recipes, setRecipes] = useState<MenuItemRecipeResponse[]>([]);
  const [ingredients, setIngredients] = useState<IngredientResponse[]>([]);
  const [units, setUnits] = useState<UnitOfMeasureResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load recipes and ingredients/units
  useEffect(() => {
    if (!outletId || !menuItemId) {
      setRecipes([]);
      return;
    }

    setLoading(true);
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

  const handleAddRecipe = () => {
    if (!ingredients.length || !units.length) return;

    const newRecipe: MenuItemRecipeUpsertInput = {
      ingredientId: ingredients[0].id,
      quantity: 1,
      unitId: units[0].id,
      notes: '',
      isOptional: false,
      sortOrder: recipes.length,
    };

    setRecipes([...recipes, {
      id: `temp-${Date.now()}`,
      menuItemId: menuItemId || '',
      ingredientId: newRecipe.ingredientId,
      ingredientName: ingredients.find(i => i.id === newRecipe.ingredientId)?.name || null,
      unitId: newRecipe.unitId,
      unitName: units.find(u => u.id === newRecipe.unitId)?.name || null,
      unitAbbreviation: units.find(u => u.id === newRecipe.unitId)?.abbreviation || null,
      quantity: newRecipe.quantity,
      notes: newRecipe.notes,
      isOptional: newRecipe.isOptional,
      sortOrder: newRecipe.sortOrder,
    }]);
  };

  const handleRemoveRecipe = (index: number) => {
    const newRecipes = recipes.filter((_, i) => i !== index);
    setRecipes(newRecipes);
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
  };

  const handleSave = async () => {
    if (!outletId || !menuItemId) return;

    setSaving(true);
    setError(null);

    try {
      const recipesToSave: MenuItemRecipeUpsertInput[] = recipes.map((r) => ({
        ingredientId: r.ingredientId,
        quantity: r.quantity,
        unitId: r.unitId,
        notes: r.notes || null,
        isOptional: r.isOptional,
        sortOrder: r.sortOrder,
      }));

      const savedRecipes = await upsertMenuItemRecipes(outletId, menuItemId, recipesToSave);
      setRecipes(savedRecipes);
    } catch (err: any) {
      setError(err?.message || 'Failed to save recipes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading recipes...</div>;
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <label style={{ fontWeight: '500', fontSize: '14px' }}>Recipe Ingredients</label>
        {!disabled && (
          <button
            type="button"
            onClick={handleAddRecipe}
            disabled={!ingredients.length || !units.length}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              background: 'rgba(57, 107, 251, 1)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              opacity: (!ingredients.length || !units.length) ? 0.5 : 1,
            }}
          >
            + Add Ingredient
          </button>
        )}
      </div>

      {error && (
        <div style={{
          padding: '8px 12px',
          marginBottom: '12px',
          background: 'rgba(254, 242, 242, 1)',
          color: 'rgba(220, 38, 38, 1)',
          borderRadius: '6px',
          fontSize: '12px',
        }}>
          {error}
        </div>
      )}

      {recipes.length === 0 ? (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          background: 'rgba(249, 250, 251, 1)',
          borderRadius: '8px',
          color: '#666',
          fontSize: '14px',
        }}>
          No ingredients added. Click "Add Ingredient" to create a recipe.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recipes.map((recipe, index) => (
            <div
              key={recipe.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 80px 40px',
                gap: '8px',
                padding: '12px',
                background: 'rgba(249, 250, 251, 1)',
                borderRadius: '8px',
                alignItems: 'center',
              }}
            >
              {/* Ingredient */}
              <select
                value={recipe.ingredientId}
                onChange={(e) => handleUpdateRecipe(index, 'ingredientId', e.target.value)}
                disabled={disabled}
                style={{
                  padding: '6px 8px',
                  border: '1px solid rgba(209, 213, 219, 1)',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </select>

              {/* Quantity */}
              <input
                type="number"
                value={recipe.quantity}
                onChange={(e) => handleUpdateRecipe(index, 'quantity', Number.parseFloat(e.target.value) || 0)}
                disabled={disabled}
                min="0"
                step="0.01"
                style={{
                  padding: '6px 8px',
                  border: '1px solid rgba(209, 213, 219, 1)',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              />

              {/* Unit */}
              <select
                value={recipe.unitId}
                onChange={(e) => handleUpdateRecipe(index, 'unitId', e.target.value)}
                disabled={disabled}
                style={{
                  padding: '6px 8px',
                  border: '1px solid rgba(209, 213, 219, 1)',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.abbreviation} ({unit.name})
                  </option>
                ))}
              </select>

              {/* Optional checkbox */}
              <label htmlFor={`recipe-optional-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: disabled ? 'not-allowed' : 'pointer' }}>
                <input
                  id={`recipe-optional-${index}`}
                  type="checkbox"
                  checked={recipe.isOptional}
                  onChange={(e) => handleUpdateRecipe(index, 'isOptional', e.target.checked)}
                  disabled={disabled}
                />
                Optional
              </label>

              {/* Remove button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveRecipe(index)}
                  style={{
                    padding: '4px 8px',
                    background: 'rgba(239, 68, 68, 1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                  aria-label="Remove ingredient"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!disabled && recipes.length > 0 && (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: 'rgba(57, 107, 251, 1)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Recipe'}
        </button>
      )}
    </div>
  );
}
