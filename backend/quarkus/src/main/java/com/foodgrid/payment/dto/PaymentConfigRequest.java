package com.foodgrid.payment.dto;

import com.foodgrid.payment.model.PaymentGatewayType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request to configure payment gateway for a client.
 */
public record PaymentConfigRequest(
    @NotNull PaymentGatewayType gatewayType,
    @NotBlank String apiKey,
    @NotBlank String secretKey,
    String webhookSecret,
    String merchantId,
    boolean isActive,
    boolean isLiveMode,
    String additionalConfig,
    boolean autoCaptureEnabled,
    boolean partialRefundEnabled,
    String webhookUrl
) {}
