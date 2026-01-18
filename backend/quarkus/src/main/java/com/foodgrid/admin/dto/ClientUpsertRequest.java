package com.foodgrid.admin.dto;

import jakarta.validation.constraints.NotBlank;

public record ClientUpsertRequest(
  @NotBlank String name,
  String contactEmail,
  String status,
  String adminEmail,
  String adminPassword,
  String adminDisplayName
) {}
