package com.foodgrid.pos.dto;

import com.foodgrid.pos.model.IngredientCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record IngredientCategoryUpsertRequest(
    @NotBlank @Size(max = 120) String name,
    @Size(max = 500) String description,
    @Size(max = 50) String icon,
    Integer sortOrder,
    IngredientCategory.Status status
) {}
