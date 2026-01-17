package com.foodgrid.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AdminUserCreateRequest(
  @NotBlank @Email String email,
  @NotBlank String password,
  @NotBlank String displayName,
  String status
) {}
