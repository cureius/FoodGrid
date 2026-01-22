package com.foodgrid.pos.dto;

import java.math.BigDecimal;

public record MenuItemRecipeUpsertRequest(
  String ingredientId,
  BigDecimal quantity,
  String unitId,
  String notes,
  Boolean isOptional,
  Integer sortOrder
) {}
