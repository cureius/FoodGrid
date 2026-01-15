package com.foodgrid.pos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PaymentCreateRequest(
  @NotBlank String method,
  @NotNull BigDecimal amount
) {}
