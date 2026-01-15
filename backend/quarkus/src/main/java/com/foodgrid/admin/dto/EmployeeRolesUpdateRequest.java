package com.foodgrid.admin.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record EmployeeRolesUpdateRequest(
  @NotNull List<String> roles
) {}
