package com.foodgrid.admin.dto;

import jakarta.validation.constraints.NotBlank;

public record PosDeviceUpdateRequest(
  @NotBlank String name
) {}
