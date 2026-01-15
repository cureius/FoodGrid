package com.foodgrid.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AdminUserUpdateRequest(
  String outletId,
  @NotBlank @Email String email,
  String password,
  @NotBlank String displayName,
  String status
) {}
