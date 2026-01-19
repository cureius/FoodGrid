package com.foodgrid.pos.dto;

import com.foodgrid.pos.model.Ingredient;
import java.math.BigDecimal;

public record IngredientResponse(
    String id,
    String categoryId,
    String categoryName,
    String sku,
    String name,
    String description,
    String imageUrl,
    String unitId,
    String unitName,
    String unitAbbreviation,
    BigDecimal costPrice,
    Boolean isSellable,
    BigDecimal sellingPrice,
    String linkedMenuItemId,
    Boolean trackInventory,
    BigDecimal currentStock,
    BigDecimal reorderLevel,
    BigDecimal reorderQuantity,
    BigDecimal maxStockLevel,
    Integer shelfLifeDays,
    String storageInstructions,
    String defaultSupplierId,
    String defaultSupplierName,
    Ingredient.Status status,
    String stockStatus
) {
  public static IngredientResponse from(Ingredient entity, String categoryName, String unitName, 
                                         String unitAbbreviation, String supplierName) {
    String stockStatus = calculateStockStatus(entity);
    return new IngredientResponse(
        entity.id,
        entity.categoryId,
        categoryName,
        entity.sku,
        entity.name,
        entity.description,
        entity.imageUrl,
        entity.unitId,
        unitName,
        unitAbbreviation,
        entity.costPrice,
        entity.isSellable,
        entity.sellingPrice,
        entity.linkedMenuItemId,
        entity.trackInventory,
        entity.currentStock,
        entity.reorderLevel,
        entity.reorderQuantity,
        entity.maxStockLevel,
        entity.shelfLifeDays,
        entity.storageInstructions,
        entity.defaultSupplierId,
        supplierName,
        entity.status,
        stockStatus
    );
  }

  private static String calculateStockStatus(Ingredient entity) {
    if (!entity.trackInventory) return "NOT_TRACKED";
    if (entity.currentStock.compareTo(BigDecimal.ZERO) <= 0) return "OUT_OF_STOCK";
    if (entity.reorderLevel != null && entity.currentStock.compareTo(entity.reorderLevel) <= 0) return "LOW";
    if (entity.maxStockLevel != null && entity.currentStock.compareTo(entity.maxStockLevel) >= 0) return "OVERSTOCKED";
    if (entity.reorderLevel != null) {
      BigDecimal midPoint = entity.reorderLevel.multiply(BigDecimal.valueOf(2));
      if (entity.currentStock.compareTo(midPoint) <= 0) return "MEDIUM";
    }
    return "HIGH";
  }
}
