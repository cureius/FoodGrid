package com.foodgrid.pos.dto;

import com.foodgrid.pos.model.IngredientCategory;

public record IngredientCategoryResponse(
    String id,
    String name,
    String description,
    String icon,
    Integer sortOrder,
    IngredientCategory.Status status
) {
  public static IngredientCategoryResponse from(IngredientCategory entity) {
    return new IngredientCategoryResponse(
        entity.id,
        entity.name,
        entity.description,
        entity.icon,
        entity.sortOrder,
        entity.status
    );
  }
}
