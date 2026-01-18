package com.foodgrid.payment.dto;

import com.foodgrid.payment.model.PaymentGatewayType;

import java.util.Date;

/**
 * Payment configuration response (without sensitive data).
 */
public record PaymentConfigResponse(
    String id,
    String clientId,
    PaymentGatewayType gatewayType,
    String merchantId,
    boolean isActive,
    boolean isLiveMode,
    Date createdAt,
    Date updatedAt
) {}
