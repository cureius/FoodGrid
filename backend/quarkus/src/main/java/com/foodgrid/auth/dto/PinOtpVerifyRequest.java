package com.foodgrid.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PinOtpVerifyRequest(
  @NotBlank String challengeId,
  @NotBlank @Size(min = 6, max = 6) String otp,
  @NotBlank String deviceId
) {}
