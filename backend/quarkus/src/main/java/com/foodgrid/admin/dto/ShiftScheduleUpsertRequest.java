package com.foodgrid.admin.dto;

import jakarta.validation.constraints.NotBlank;

public record ShiftScheduleUpsertRequest(
  @NotBlank String employeeId,
  @NotBlank String startAt,
  @NotBlank String endAt
) {}
