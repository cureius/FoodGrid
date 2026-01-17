package com.foodgrid.admin.dto;

import jakarta.validation.constraints.NotBlank;

public record OutletUpsertRequest(
  @NotBlank String ownerId,
  @NotBlank String name,
  @NotBlank String timezone,
  String status
) {}
