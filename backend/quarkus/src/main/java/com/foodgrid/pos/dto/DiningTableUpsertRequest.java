package com.foodgrid.pos.dto;

import jakarta.validation.constraints.NotBlank;

public record DiningTableUpsertRequest(
  @NotBlank String tableCode,
  @NotBlank String displayName,
  Integer capacity,
  String status
) {}
