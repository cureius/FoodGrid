package com.foodgrid.pos.dto;

import jakarta.validation.constraints.NotBlank;

public record OrderCreateRequest(
  @NotBlank String orderType,
  String tableId,
  String notes
) {}
