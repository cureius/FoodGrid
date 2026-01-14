package com.foodgrid.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PinOtpRequest(
  @NotBlank @Email String email,
  @NotBlank String deviceId
) {}
