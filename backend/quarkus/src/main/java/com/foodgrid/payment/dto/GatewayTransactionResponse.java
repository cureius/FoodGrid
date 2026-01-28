package com.foodgrid.payment.dto;

import com.foodgrid.payment.model.GatewayTransactionStatus;
import com.foodgrid.payment.model.PaymentGatewayType;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Gateway transaction response.
 */
public record GatewayTransactionResponse(
    String id,
    String orderId,
    String paymentId,
    PaymentGatewayType gatewayType,
    String gatewayOrderId,
    String gatewayPaymentId,
    BigDecimal amount,
    String currency,
    GatewayTransactionStatus status,
    String paymentMethod,
    String failureReason,
    Instant createdAt,
    Instant completedAt
) {}
