package com.foodgrid.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record PinOtpResendRequest(@NotBlank String challengeId) {}
