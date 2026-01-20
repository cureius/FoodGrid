package com.foodgrid.pos.service;

import com.foodgrid.pos.dto.*;
import com.foodgrid.pos.model.*;
import com.foodgrid.pos.repo.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class IngredientService {

  @Inject IngredientRepository ingredientRepo;
  @Inject IngredientCategoryRepository categoryRepo;
  @Inject UnitOfMeasureRepository unitRepo;
  @Inject SupplierRepository supplierRepo;
  @Inject StockMovementRepository stockMovementRepo;

  // ==================== INGREDIENT CATEGORIES ====================

  public List<IngredientCategoryResponse> listCategories(String outletId) {
    return categoryRepo.listByOutlet(outletId).stream()
        .map(IngredientCategoryResponse::from)
        .toList();
  }

  @Transactional
  public IngredientCategoryResponse createCategory(String outletId, IngredientCategoryUpsertRequest request) {
    if (categoryRepo.existsByNameAndOutlet(request.name(), outletId)) {
      throw new BadRequestException("Category with this name already exists");
    }

    IngredientCategory category = new IngredientCategory();
    category.id = UUID.randomUUID().toString();
    category.outletId = outletId;
    category.name = request.name();
    category.description = request.description();
    category.icon = request.icon();
    category.sortOrder = request.sortOrder() != null ? request.sortOrder() : 0;
    category.status = request.status() != null ? request.status() : IngredientCategory.Status.ACTIVE;
    categoryRepo.persist(category);

    return IngredientCategoryResponse.from(category);
  }

  @Transactional
  public IngredientCategoryResponse updateCategory(String outletId, String categoryId, IngredientCategoryUpsertRequest request) {
    IngredientCategory category = categoryRepo.findByIdAndOutlet(categoryId, outletId)
        .orElseThrow(() -> new NotFoundException("Category not found"));

    if (categoryRepo.existsByNameAndOutletExcludingId(request.name(), outletId, categoryId)) {
      throw new BadRequestException("Category with this name already exists");
    }

    category.name = request.name();
    category.description = request.description();
    category.icon = request.icon();
    if (request.sortOrder() != null) category.sortOrder = request.sortOrder();
    if (request.status() != null) category.status = request.status();

    return IngredientCategoryResponse.from(category);
  }

  @Transactional
  public void deleteCategory(String outletId, String categoryId) {
    IngredientCategory category = categoryRepo.findByIdAndOutlet(categoryId, outletId)
        .orElseThrow(() -> new NotFoundException("Category not found"));

    long ingredientCount = ingredientRepo.countByCategory(categoryId);
    if (ingredientCount > 0) {
      throw new BadRequestException("Cannot delete category with existing ingredients. Move or delete ingredients first.");
    }

    categoryRepo.delete(category);
  }

  // ==================== UNITS OF MEASURE ====================

  public List<UnitOfMeasureResponse> listUnits(String outletId) {
    return unitRepo.listByOutlet(outletId).stream()
        .map(UnitOfMeasureResponse::from)
        .toList();
  }

  @Transactional
  public UnitOfMeasureResponse createUnit(String outletId, UnitOfMeasureUpsertRequest request) {
    if (unitRepo.existsByNameAndOutlet(request.name(), outletId)) {
      throw new BadRequestException("Unit with this name already exists");
    }

    UnitOfMeasure unit = new UnitOfMeasure();
    unit.id = UUID.randomUUID().toString();
    unit.outletId = outletId;
    unit.name = request.name();
    unit.abbreviation = request.abbreviation();
    unit.unitType = request.unitType();
    unit.baseUnitId = request.baseUnitId();
    unit.conversionFactor = request.conversionFactor();
    unit.status = request.status() != null ? request.status() : UnitOfMeasure.Status.ACTIVE;
    unitRepo.persist(unit);

    return UnitOfMeasureResponse.from(unit);
  }

  @Transactional
  public UnitOfMeasureResponse updateUnit(String outletId, String unitId, UnitOfMeasureUpsertRequest request) {
    UnitOfMeasure unit = unitRepo.findByIdAndOutlet(unitId, outletId)
        .orElseThrow(() -> new NotFoundException("Unit not found"));

    unit.name = request.name();
    unit.abbreviation = request.abbreviation();
    unit.unitType = request.unitType();
    unit.baseUnitId = request.baseUnitId();
    unit.conversionFactor = request.conversionFactor();
    if (request.status() != null) unit.status = request.status();

    return UnitOfMeasureResponse.from(unit);
  }

  @Transactional
  public void deleteUnit(String outletId, String unitId) {
    UnitOfMeasure unit = unitRepo.findByIdAndOutlet(unitId, outletId)
        .orElseThrow(() -> new NotFoundException("Unit not found"));
    unitRepo.delete(unit);
  }

  // ==================== SUPPLIERS ====================

  public List<SupplierResponse> listSuppliers(String outletId) {
    return supplierRepo.listByOutlet(outletId).stream()
        .map(SupplierResponse::from)
        .toList();
  }

  @Transactional
  public SupplierResponse createSupplier(String outletId, SupplierUpsertRequest request) {
    Supplier supplier = new Supplier();
    supplier.id = UUID.randomUUID().toString();
    supplier.outletId = outletId;
    supplier.name = request.name();
    supplier.contactPerson = request.contactPerson();
    supplier.email = request.email();
    supplier.phone = request.phone();
    supplier.address = request.address();
    supplier.notes = request.notes();
    supplier.status = request.status() != null ? request.status() : Supplier.Status.ACTIVE;
    supplierRepo.persist(supplier);

    return SupplierResponse.from(supplier);
  }

  @Transactional
  public SupplierResponse updateSupplier(String outletId, String supplierId, SupplierUpsertRequest request) {
    Supplier supplier = supplierRepo.findByIdAndOutlet(supplierId, outletId)
        .orElseThrow(() -> new NotFoundException("Supplier not found"));

    supplier.name = request.name();
    supplier.contactPerson = request.contactPerson();
    supplier.email = request.email();
    supplier.phone = request.phone();
    supplier.address = request.address();
    supplier.notes = request.notes();
    if (request.status() != null) supplier.status = request.status();

    return SupplierResponse.from(supplier);
  }

  @Transactional
  public void deleteSupplier(String outletId, String supplierId) {
    Supplier supplier = supplierRepo.findByIdAndOutlet(supplierId, outletId)
        .orElseThrow(() -> new NotFoundException("Supplier not found"));
    supplierRepo.delete(supplier);
  }

  // ==================== INGREDIENTS ====================

  public List<IngredientResponse> listIngredients(String outletId) {
    return ingredientRepo.listByOutlet(outletId).stream()
        .map(this::toIngredientResponse)
        .toList();
  }

  public List<IngredientResponse> listIngredientsByCategory(String outletId, String categoryId) {
    return ingredientRepo.listByOutletAndCategory(outletId, categoryId).stream()
        .map(this::toIngredientResponse)
        .toList();
  }

  public List<IngredientResponse> listLowStockIngredients(String outletId) {
    return ingredientRepo.listLowStock(outletId).stream()
        .map(this::toIngredientResponse)
        .toList();
  }

  public IngredientResponse getIngredient(String outletId, String ingredientId) {
    Ingredient ingredient = ingredientRepo.findByIdAndOutlet(ingredientId, outletId)
        .orElseThrow(() -> new NotFoundException("Ingredient not found"));
    return toIngredientResponse(ingredient);
  }

  @Transactional
  public IngredientResponse createIngredient(String outletId, IngredientUpsertRequest request) {
    if (request.sku() != null && ingredientRepo.existsBySkuAndOutlet(request.sku(), outletId)) {
      throw new BadRequestException("Ingredient with this SKU already exists");
    }

    // Validate unit exists
    unitRepo.findByIdAndOutlet(request.unitId(), outletId)
        .orElseThrow(() -> new BadRequestException("Invalid unit ID"));

    Ingredient ingredient = new Ingredient();
    ingredient.id = UUID.randomUUID().toString();
    ingredient.outletId = outletId;
    ingredient.categoryId = request.categoryId();
    ingredient.sku = request.sku();
    ingredient.name = request.name();
    ingredient.description = request.description();
    ingredient.imageUrl = request.imageUrl();
    ingredient.unitId = request.unitId();
    ingredient.costPrice = request.costPrice() != null ? request.costPrice() : BigDecimal.ZERO;
    ingredient.isSellable = request.isSellable() != null ? request.isSellable() : false;
    ingredient.sellingPrice = request.sellingPrice();
    ingredient.linkedMenuItemId = request.linkedMenuItemId();
    ingredient.trackInventory = request.trackInventory() != null ? request.trackInventory() : true;
    ingredient.currentStock = request.currentStock() != null ? request.currentStock() : BigDecimal.ZERO;
    ingredient.reorderLevel = request.reorderLevel();
    ingredient.reorderQuantity = request.reorderQuantity();
    ingredient.maxStockLevel = request.maxStockLevel();
    ingredient.shelfLifeDays = request.shelfLifeDays();
    ingredient.storageInstructions = request.storageInstructions();
    ingredient.defaultSupplierId = request.defaultSupplierId();
    ingredient.status = request.status() != null ? request.status() : Ingredient.Status.ACTIVE;
    ingredientRepo.persist(ingredient);

    // Create opening stock movement if initial stock is provided
    if (ingredient.currentStock.compareTo(BigDecimal.ZERO) > 0) {
      createStockMovement(outletId, ingredient.id, StockMovement.MovementType.OPENING_STOCK,
          ingredient.currentStock, ingredient.unitId, ingredient.costPrice, null, null, null, "Initial stock");
    }

    return toIngredientResponse(ingredient);
  }

  @Transactional
  public IngredientResponse updateIngredient(String outletId, String ingredientId, IngredientUpsertRequest request) {
    Ingredient ingredient = ingredientRepo.findByIdAndOutlet(ingredientId, outletId)
        .orElseThrow(() -> new NotFoundException("Ingredient not found"));

    if (request.sku() != null && ingredientRepo.existsBySkuAndOutletExcludingId(request.sku(), outletId, ingredientId)) {
      throw new BadRequestException("Ingredient with this SKU already exists");
    }

    // Validate unit exists if provided
    if (request.unitId() != null) {
      unitRepo.findByIdAndOutlet(request.unitId(), outletId)
          .orElseThrow(() -> new BadRequestException("Invalid unit ID"));
    }

    ingredient.categoryId = request.categoryId();
    ingredient.sku = request.sku();
    ingredient.name = request.name();
    ingredient.description = request.description();
    ingredient.imageUrl = request.imageUrl();
    if (request.unitId() != null) ingredient.unitId = request.unitId();
    if (request.costPrice() != null) ingredient.costPrice = request.costPrice();
    if (request.isSellable() != null) ingredient.isSellable = request.isSellable();
    ingredient.sellingPrice = request.sellingPrice();
    ingredient.linkedMenuItemId = request.linkedMenuItemId();
    if (request.trackInventory() != null) ingredient.trackInventory = request.trackInventory();
    ingredient.reorderLevel = request.reorderLevel();
    ingredient.reorderQuantity = request.reorderQuantity();
    ingredient.maxStockLevel = request.maxStockLevel();
    ingredient.shelfLifeDays = request.shelfLifeDays();
    ingredient.storageInstructions = request.storageInstructions();
    ingredient.defaultSupplierId = request.defaultSupplierId();
    if (request.status() != null) ingredient.status = request.status();

    return toIngredientResponse(ingredient);
  }

  @Transactional
  public void deleteIngredient(String outletId, String ingredientId) {
    Ingredient ingredient = ingredientRepo.findByIdAndOutlet(ingredientId, outletId)
        .orElseThrow(() -> new NotFoundException("Ingredient not found"));
    ingredientRepo.delete(ingredient);
  }

  // ==================== STOCK MOVEMENTS ====================

  public List<StockMovementResponse> listStockMovements(String outletId, String ingredientId) {
    List<StockMovement> movements = ingredientId != null 
        ? stockMovementRepo.listByIngredient(ingredientId)
        : stockMovementRepo.listByOutlet(outletId);
    
    return movements.stream()
        .map(this::toStockMovementResponse)
        .toList();
  }

  @Transactional
  public StockMovementResponse recordStockMovement(String outletId, StockMovementCreateRequest request) {
    Ingredient ingredient = ingredientRepo.findByIdAndOutlet(request.ingredientId(), outletId)
        .orElseThrow(() -> new NotFoundException("Ingredient not found"));

    BigDecimal quantity = request.quantity();
    BigDecimal stockBefore = ingredient.currentStock;
    BigDecimal stockAfter;

    // Calculate new stock based on movement type
    switch (request.movementType()) {
      case PURCHASE, TRANSFER_IN, RETURN, OPENING_STOCK, ADJUSTMENT -> {
        if (request.movementType() == StockMovement.MovementType.ADJUSTMENT) {
          // For adjustment, quantity can be negative (decrease) or positive (increase)
          stockAfter = stockBefore.add(quantity);
        } else {
          stockAfter = stockBefore.add(quantity.abs());
        }
      }
      case USAGE, WASTAGE, TRANSFER_OUT -> {
        stockAfter = stockBefore.subtract(quantity.abs());
        if (stockAfter.compareTo(BigDecimal.ZERO) < 0) {
          throw new BadRequestException("Insufficient stock. Current stock: " + stockBefore);
        }
      }
      default -> throw new BadRequestException("Invalid movement type");
    }

    // Update ingredient stock
    ingredient.currentStock = stockAfter;

    // Create stock movement record
    StockMovement movement = new StockMovement();
    movement.id = UUID.randomUUID().toString();
    movement.outletId = outletId;
    movement.ingredientId = request.ingredientId();
    movement.movementType = request.movementType();
    movement.quantity = quantity;
    movement.unitId = request.unitId();
    movement.unitCost = request.unitCost();
    movement.totalCost = request.unitCost() != null ? request.unitCost().multiply(quantity.abs()) : null;
    movement.supplierId = request.supplierId();
    movement.purchaseOrderNumber = request.purchaseOrderNumber();
    movement.invoiceNumber = request.invoiceNumber();
    movement.wastageReason = request.wastageReason();
    movement.stockBefore = stockBefore;
    movement.stockAfter = stockAfter;
    movement.notes = request.notes();
    stockMovementRepo.persist(movement);

    return toStockMovementResponse(movement);
  }

  // ==================== HELPER METHODS ====================

  private void createStockMovement(String outletId, String ingredientId, StockMovement.MovementType type,
                                    BigDecimal quantity, String unitId, BigDecimal unitCost,
                                    String supplierId, String poNumber, String invoiceNumber, String notes) {
    StockMovement movement = new StockMovement();
    movement.id = UUID.randomUUID().toString();
    movement.outletId = outletId;
    movement.ingredientId = ingredientId;
    movement.movementType = type;
    movement.quantity = quantity;
    movement.unitId = unitId;
    movement.unitCost = unitCost;
    movement.totalCost = unitCost != null ? unitCost.multiply(quantity) : null;
    movement.supplierId = supplierId;
    movement.purchaseOrderNumber = poNumber;
    movement.invoiceNumber = invoiceNumber;
    movement.stockBefore = BigDecimal.ZERO;
    movement.stockAfter = quantity;
    movement.notes = notes;
    stockMovementRepo.persist(movement);
  }

  private IngredientResponse toIngredientResponse(Ingredient ingredient) {
    String categoryName = null;
    if (ingredient.categoryId != null) {
      IngredientCategory category = categoryRepo.findById(ingredient.categoryId);
      categoryName = category != null ? category.name : null;
    }

    UnitOfMeasure unit = unitRepo.findById(ingredient.unitId);
    String unitName = unit != null ? unit.name : null;
    String unitAbbreviation = unit != null ? unit.abbreviation : null;

    String supplierName = null;
    if (ingredient.defaultSupplierId != null) {
      Supplier supplier = supplierRepo.findById(ingredient.defaultSupplierId);
      supplierName = supplier != null ? supplier.name : null;
    }

    return IngredientResponse.from(ingredient, categoryName, unitName, unitAbbreviation, supplierName);
  }

  private StockMovementResponse toStockMovementResponse(StockMovement movement) {
    Ingredient ingredient = ingredientRepo.findById(movement.ingredientId);
    String ingredientName = ingredient != null ? ingredient.name : null;

    UnitOfMeasure unit = unitRepo.findById(movement.unitId);
    String unitAbbreviation = unit != null ? unit.abbreviation : null;

    String supplierName = null;
    if (movement.supplierId != null) {
      Supplier supplier = supplierRepo.findById(movement.supplierId);
      supplierName = supplier != null ? supplier.name : null;
    }

    // TODO: Get employee name if needed
    String employeeName = null;

    return StockMovementResponse.from(movement, ingredientName, unitAbbreviation, supplierName, employeeName);
  }
}
