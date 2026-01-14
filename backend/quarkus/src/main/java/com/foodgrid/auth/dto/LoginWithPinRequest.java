package com.foodgrid.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginWithPinRequest(
  @NotBlank String employeeId,
  @NotBlank @Size(min = 6, max = 6) String pin,
  @NotBlank String deviceId
) {}
