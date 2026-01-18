package com.foodgrid.payment.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;

/**
 * Request to verify/confirm a payment after client-side completion.
 */
public record VerifyPaymentRequest(
    @NotBlank String transactionId,
    @NotBlank String gatewayPaymentId,
    String gatewaySignature,
    String gatewayOrderId,
    Map<String, String> additionalData
) {}
