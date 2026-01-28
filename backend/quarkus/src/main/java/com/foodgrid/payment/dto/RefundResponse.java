package com.foodgrid.payment.dto;

import com.foodgrid.payment.model.RefundStatus;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Refund response.
 */
public record RefundResponse(
    String id,
    String transactionId,
    String gatewayRefundId,
    BigDecimal amount,
    RefundStatus status,
    String reason,
    Instant createdAt,
    Instant processedAt
) {}
