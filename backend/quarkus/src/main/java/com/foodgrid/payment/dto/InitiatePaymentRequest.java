package com.foodgrid.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Request to initiate a payment for an order.
 */
public record InitiatePaymentRequest(
    @NotBlank String orderId,
    @NotNull @DecimalMin("0.01") BigDecimal amount,
    String currency,
    String paymentId,
    Map<String, String> metadata,
    String idempotencyKey
) {
    public String effectiveCurrency() {
        return currency == null || currency.isBlank() ? "INR" : currency;
    }
}
