package com.foodgrid.pos.dto;

import java.math.BigDecimal;

public record MenuItemRecipeResponse(
  String id,
  String menuItemId,
  String ingredientId,
  String ingredientName,
  String unitId,
  String unitName,
  String unitAbbreviation,
  BigDecimal quantity,
  String notes,
  Boolean isOptional,
  Integer sortOrder
) {}
