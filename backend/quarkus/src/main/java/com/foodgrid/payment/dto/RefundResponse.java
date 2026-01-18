package com.foodgrid.payment.dto;

import com.foodgrid.payment.model.RefundStatus;

import java.math.BigDecimal;
import java.util.Date;

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
    Date createdAt,
    Date processedAt
) {}
