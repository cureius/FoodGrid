package com.foodgrid.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EmployeeUpsertRequest(
  @NotBlank String displayName,
  @NotBlank @Email String email,
  String avatarUrl,
  String status,
  String pin
) {}
