const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) msg = body.message;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) return null as T;

  const text = await res.text();
  if (!text || text.trim().length === 0) return null as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null as T;
  }
}

function clientAdminAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("fg_client_admin_access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Backend currently exposes these as /api/v1/admin/*; client-admin is a UI separation.
export function adminLogin(input: { email: string; password: string }) {
  return http<any>(`/api/v1/admin/auth/login`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export type OutletUpsertInput = {
  name: string;
  timezone: string;
  ownerId: string;
  status?: string;
};

export function listOutlets() {
  return http<any[]>(`/api/v1/admin/outlets`, {
    method: "GET",
    headers: {
      ...clientAdminAuthHeader()
    }
  });
}

export function createOutlet(input: OutletUpsertInput) {
  return http<any>(`/api/v1/admin/outlets`, {
    method: "POST",
    headers: {
      ...clientAdminAuthHeader()
    },
    body: JSON.stringify(input)
  });
}

export function updateOutlet(outletId: string, input: OutletUpsertInput) {
  return http<any>(`/api/v1/admin/outlets/${encodeURIComponent(outletId)}`, {
    method: "PUT",
    headers: {
      ...clientAdminAuthHeader()
    },
    body: JSON.stringify(input)
  });
}

export function deleteOutlet(outletId: string) {
  return http<void>(`/api/v1/admin/outlets/${encodeURIComponent(outletId)}`, {
    method: "DELETE",
    headers: {
      ...clientAdminAuthHeader()
    }
  });
}

export type EmployeeUpsertInput = {
  displayName: string;
  email: string;
  avatarUrl?: string;
  status?: string;
  pin?: string;
};

export function listEmployees(outletId: string) {
  return http<any[]>(`/api/v1/admin/outlets/${encodeURIComponent(outletId)}/employees`, {
    method: "GET",
    headers: {
      ...clientAdminAuthHeader()
    }
  });
}

export function createEmployee(outletId: string, input: EmployeeUpsertInput) {
  return http<any>(`/api/v1/admin/outlets/${encodeURIComponent(outletId)}/employees`, {
    method: "POST",
    headers: {
      ...clientAdminAuthHeader()
    },
    body: JSON.stringify(input)
  });
}

export function updateEmployee(outletId: string, employeeId: string, input: EmployeeUpsertInput) {
  return http<any>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/employees/${encodeURIComponent(employeeId)}`,
    {
      method: "PUT",
      headers: {
        ...clientAdminAuthHeader()
      },
      body: JSON.stringify(input)
    }
  );
}

export function deleteEmployee(outletId: string, employeeId: string) {
  return http<void>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/employees/${encodeURIComponent(employeeId)}`,
    {
      method: "DELETE",
      headers: {
        ...clientAdminAuthHeader()
      }
    }
  );
}

// ─────────────────────────────────────────────────────────────
// Tables (Dining Tables)
// ─────────────────────────────────────────────────────────────

export type TableUpsertInput = {
  tableCode: string;
  displayName: string;
  capacity?: number;
  status?: string;
};

export function listTables(outletId: string) {
  return http<any[]>(`/api/v1/admin/outlets/${encodeURIComponent(outletId)}/tables`, {
    method: "GET",
    headers: {
      ...clientAdminAuthHeader()
    }
  });
}

export function createTable(outletId: string, input: TableUpsertInput) {
  return http<any>(`/api/v1/admin/outlets/${encodeURIComponent(outletId)}/tables`, {
    method: "POST",
    headers: {
      ...clientAdminAuthHeader()
    },
    body: JSON.stringify(input)
  });
}

export function updateTable(outletId: string, tableId: string, input: TableUpsertInput) {
  return http<any>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/tables/${encodeURIComponent(tableId)}`,
    {
      method: "PUT",
      headers: {
        ...clientAdminAuthHeader()
      },
      body: JSON.stringify(input)
    }
  );
}

export function deleteTable(outletId: string, tableId: string) {
  return http<void>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/tables/${encodeURIComponent(tableId)}`,
    {
      method: "DELETE",
      headers: {
        ...clientAdminAuthHeader()
      }
    }
  );
}

// ─────────────────────────────────────────────────────────────
// Menu Categories
// ─────────────────────────────────────────────────────────────

export type MenuCategoryResponse = {
  id: string;
  outletId: string;
  name: string;
  sortOrder: number;
  status: string;
};

export type MenuCategoryUpsertInput = {
  name: string;
  sortOrder?: number;
  status?: string;
};

export function listMenuCategories(outletId: string) {
  return http<MenuCategoryResponse[]>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/menu/categories`,
    {
      method: "GET",
      headers: {
        ...clientAdminAuthHeader()
      }
    }
  );
}

export function createMenuCategory(outletId: string, input: MenuCategoryUpsertInput) {
  return http<MenuCategoryResponse>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/menu/categories`,
    {
      method: "POST",
      headers: {
        ...clientAdminAuthHeader()
      },
      body: JSON.stringify(input)
    }
  );
}

export function updateMenuCategory(outletId: string, categoryId: string, input: MenuCategoryUpsertInput) {
  return http<MenuCategoryResponse>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/menu/categories/${encodeURIComponent(categoryId)}`,
    {
      method: "PUT",
      headers: {
        ...clientAdminAuthHeader()
      },
      body: JSON.stringify(input)
    }
  );
}

export function deleteMenuCategory(outletId: string, categoryId: string) {
  return http<void>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/menu/categories/${encodeURIComponent(categoryId)}`,
    {
      method: "DELETE",
      headers: {
        ...clientAdminAuthHeader()
      }
    }
  );
}

// ─────────────────────────────────────────────────────────────
// Ingredient Categories
// ─────────────────────────────────────────────────────────────

export type IngredientCategoryResponse = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
};

export type IngredientCategoryUpsertInput = {
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  status?: 'ACTIVE' | 'INACTIVE';
};

export function listIngredientCategories(outletId: string) {
  return http<IngredientCategoryResponse[]>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/categories`,
    {
      method: "GET",
      headers: { ...clientAdminAuthHeader() }
    }
  );
}

export function createIngredientCategory(outletId: string, input: IngredientCategoryUpsertInput) {
  return http<IngredientCategoryResponse>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/categories`,
    {
      method: "POST",
      headers: { ...clientAdminAuthHeader() },
      body: JSON.stringify(input)
    }
  );
}

export function updateIngredientCategory(outletId: string, categoryId: string, input: IngredientCategoryUpsertInput) {
  return http<IngredientCategoryResponse>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/categories/${encodeURIComponent(categoryId)}`,
    {
      method: "PUT",
      headers: { ...clientAdminAuthHeader() },
      body: JSON.stringify(input)
    }
  );
}

export function deleteIngredientCategory(outletId: string, categoryId: string) {
  return http<void>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/categories/${encodeURIComponent(categoryId)}`,
    {
      method: "DELETE",
      headers: { ...clientAdminAuthHeader() }
    }
  );
}

// ─────────────────────────────────────────────────────────────
// Units of Measure
// ─────────────────────────────────────────────────────────────

export type UnitOfMeasureResponse = {
  id: string;
  name: string;
  abbreviation: string;
  unitType: 'WEIGHT' | 'VOLUME' | 'COUNT' | 'LENGTH';
  baseUnitId: string | null;
  conversionFactor: number | null;
  status: 'ACTIVE' | 'INACTIVE';
};

export type UnitOfMeasureUpsertInput = {
  name: string;
  abbreviation: string;
  unitType: 'WEIGHT' | 'VOLUME' | 'COUNT' | 'LENGTH';
  baseUnitId?: string;
  conversionFactor?: number;
  status?: 'ACTIVE' | 'INACTIVE';
};

export function listUnitsOfMeasure(outletId: string) {
  return http<UnitOfMeasureResponse[]>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/units`,
    {
      method: "GET",
      headers: { ...clientAdminAuthHeader() }
    }
  );
}

export function createUnitOfMeasure(outletId: string, input: UnitOfMeasureUpsertInput) {
  return http<UnitOfMeasureResponse>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/units`,
    {
      method: "POST",
      headers: { ...clientAdminAuthHeader() },
      body: JSON.stringify(input)
    }
  );
}

export function updateUnitOfMeasure(outletId: string, unitId: string, input: UnitOfMeasureUpsertInput) {
  return http<UnitOfMeasureResponse>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/units/${encodeURIComponent(unitId)}`,
    {
      method: "PUT",
      headers: { ...clientAdminAuthHeader() },
      body: JSON.stringify(input)
    }
  );
}

export function deleteUnitOfMeasure(outletId: string, unitId: string) {
  return http<void>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/units/${encodeURIComponent(unitId)}`,
    {
      method: "DELETE",
      headers: { ...clientAdminAuthHeader() }
    }
  );
}

// ─────────────────────────────────────────────────────────────
// Suppliers
// ─────────────────────────────────────────────────────────────

export type SupplierResponse = {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  status: 'ACTIVE' | 'INACTIVE';
};

export type SupplierUpsertInput = {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  status?: 'ACTIVE' | 'INACTIVE';
};

export function listSuppliers(outletId: string) {
  return http<SupplierResponse[]>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/suppliers`,
    {
      method: "GET",
      headers: { ...clientAdminAuthHeader() }
    }
  );
}

export function createSupplier(outletId: string, input: SupplierUpsertInput) {
  return http<SupplierResponse>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/suppliers`,
    {
      method: "POST",
      headers: { ...clientAdminAuthHeader() },
      body: JSON.stringify(input)
    }
  );
}

export function updateSupplier(outletId: string, supplierId: string, input: SupplierUpsertInput) {
  return http<SupplierResponse>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/suppliers/${encodeURIComponent(supplierId)}`,
    {
      method: "PUT",
      headers: { ...clientAdminAuthHeader() },
      body: JSON.stringify(input)
    }
  );
}

export function deleteSupplier(outletId: string, supplierId: string) {
  return http<void>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/suppliers/${encodeURIComponent(supplierId)}`,
    {
      method: "DELETE",
      headers: { ...clientAdminAuthHeader() }
    }
  );
}

// ─────────────────────────────────────────────────────────────
// Ingredients
// ─────────────────────────────────────────────────────────────

export type IngredientResponse = {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  sku: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  unitId: string;
  unitName: string | null;
  unitAbbreviation: string | null;
  costPrice: number;
  isSellable: boolean;
  sellingPrice: number | null;
  linkedMenuItemId: string | null;
  trackInventory: boolean;
  currentStock: number;
  reorderLevel: number | null;
  reorderQuantity: number | null;
  maxStockLevel: number | null;
  shelfLifeDays: number | null;
  storageInstructions: string | null;
  defaultSupplierId: string | null;
  defaultSupplierName: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  stockStatus: 'HIGH' | 'MEDIUM' | 'LOW' | 'OUT_OF_STOCK' | 'OVERSTOCKED' | 'NOT_TRACKED';
};

export type IngredientUpsertInput = {
  categoryId?: string;
  sku?: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  unitId: string;
  costPrice: number;
  isSellable?: boolean | null;
  sellingPrice?: number | null;
  linkedMenuItemId?: string | null;
  trackInventory?: boolean | null;
  currentStock?: number | null;
  reorderLevel?: number | null;
  reorderQuantity?: number | null;
  maxStockLevel?: number | null;
  shelfLifeDays?: number | null;
  storageInstructions?: string | null;
  defaultSupplierId?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
};

export function listIngredients(outletId: string, params?: { categoryId?: string; lowStock?: boolean }) {
  const searchParams = new URLSearchParams();
  if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params?.lowStock) searchParams.set('lowStock', 'true');
  const query = searchParams.toString();
  
  return http<IngredientResponse[]>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/ingredients${query ? `?${query}` : ''}`,
    {
      method: "GET",
      headers: { ...clientAdminAuthHeader() }
    }
  );
}

export function getIngredient(outletId: string, ingredientId: string) {
  return http<IngredientResponse>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/ingredients/${encodeURIComponent(ingredientId)}`,
    {
      method: "GET",
      headers: { ...clientAdminAuthHeader() }
    }
  );
}

export function createIngredient(outletId: string, input: IngredientUpsertInput) {
  return http<IngredientResponse>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/ingredients`,
    {
      method: "POST",
      headers: { ...clientAdminAuthHeader() },
      body: JSON.stringify(input)
    }
  );
}

export function updateIngredient(outletId: string, ingredientId: string, input: IngredientUpsertInput) {
  return http<IngredientResponse>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/ingredients/${encodeURIComponent(ingredientId)}`,
    {
      method: "PUT",
      headers: { ...clientAdminAuthHeader() },
      body: JSON.stringify(input)
    }
  );
}

export function deleteIngredient(outletId: string, ingredientId: string) {
  return http<void>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/ingredients/${encodeURIComponent(ingredientId)}`,
    {
      method: "DELETE",
      headers: { ...clientAdminAuthHeader() }
    }
  );
}

// ─────────────────────────────────────────────────────────────
// Stock Movements
// ─────────────────────────────────────────────────────────────

export type StockMovementType = 'PURCHASE' | 'USAGE' | 'WASTAGE' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'RETURN' | 'OPENING_STOCK';

export type StockMovementResponse = {
  id: string;
  ingredientId: string;
  ingredientName: string | null;
  movementType: StockMovementType;
  quantity: number;
  unitId: string;
  unitAbbreviation: string | null;
  unitCost: number | null;
  totalCost: number | null;
  referenceType: string | null;
  referenceId: string | null;
  supplierId: string | null;
  supplierName: string | null;
  purchaseOrderNumber: string | null;
  invoiceNumber: string | null;
  wastageReason: string | null;
  stockBefore: number;
  stockAfter: number;
  notes: string | null;
  recordedByEmployeeId: string | null;
  recordedByEmployeeName: string | null;
  recordedAt: string;
};

export type StockMovementCreateInput = {
  ingredientId: string;
  movementType: StockMovementType;
  quantity: number;
  unitId: string;
  unitCost?: number;
  supplierId?: string;
  purchaseOrderNumber?: string;
  invoiceNumber?: string;
  wastageReason?: string;
  notes?: string;
};

export function listStockMovements(outletId: string, ingredientId?: string) {
  const query = ingredientId ? `?ingredientId=${encodeURIComponent(ingredientId)}` : '';
  return http<StockMovementResponse[]>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/stock-movements${query}`,
    {
      method: "GET",
      headers: { ...clientAdminAuthHeader() }
    }
  );
}

export function createStockMovement(outletId: string, input: StockMovementCreateInput) {
  return http<StockMovementResponse>(
    `/api/v1/admin/outlets/${encodeURIComponent(outletId)}/inventory/stock-movements`,
    {
      method: "POST",
      headers: { ...clientAdminAuthHeader() },
      body: JSON.stringify(input)
    }
  );
}
