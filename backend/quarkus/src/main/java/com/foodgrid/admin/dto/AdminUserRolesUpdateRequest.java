package com.foodgrid.admin.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record AdminUserRolesUpdateRequest(
  @NotNull List<String> roles
) {}
