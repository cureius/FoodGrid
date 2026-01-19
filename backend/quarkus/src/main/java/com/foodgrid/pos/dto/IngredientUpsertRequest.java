package com.foodgrid.pos.dto;

import com.foodgrid.pos.model.Ingredient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record IngredientUpsertRequest(
    String categoryId,
    @Size(max = 50) String sku,
    @NotBlank @Size(max = 200) String name,
    String description,
    @Size(max = 500) String imageUrl,
    @NotNull String unitId,
    @NotNull BigDecimal costPrice,
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
    Ingredient.Status status
) {}
