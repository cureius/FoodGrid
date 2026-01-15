package com.foodgrid.pos.dto;

import jakarta.validation.constraints.NotBlank;

public record MenuCategoryUpsertRequest(
  @NotBlank String name,
  Integer sortOrder,
  String status
) {}
