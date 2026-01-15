package com.foodgrid.pos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record MenuItemUpsertRequest(
  String categoryId,
  @NotBlank String name,
  String description,
  Boolean isVeg,
  @NotNull BigDecimal basePrice,
  String status
) {}
