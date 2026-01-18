package com.foodgrid.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Request to process a refund.
 */
public record RefundRequest(
    @NotBlank String transactionId,
    @NotNull @DecimalMin("0.01") BigDecimal amount,
    String reason
) {}
