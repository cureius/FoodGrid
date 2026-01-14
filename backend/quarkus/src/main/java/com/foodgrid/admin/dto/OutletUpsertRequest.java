package com.foodgrid.admin.dto;

import jakarta.validation.constraints.NotBlank;

public record OutletUpsertRequest(
  @NotBlank String name,
  @NotBlank String timezone
) {}
