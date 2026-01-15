package com.foodgrid.pos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record OrderAddItemRequest(
  @NotBlank String itemId,
  @NotNull BigDecimal qty
) {}
