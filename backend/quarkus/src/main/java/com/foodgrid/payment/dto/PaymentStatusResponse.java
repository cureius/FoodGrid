package com.foodgrid.payment.dto;

import java.math.BigDecimal;

/**
 * Response containing payment status for an order.
 * Used by UI to poll for payment status.
 */
public record PaymentStatusResponse(
    String orderId,
    String transactionId,
    String gatewayType,
    String gatewayOrderId,
    String gatewayPaymentId,
    String transactionStatus,
    String orderStatus,
    BigDecimal amount
) {}
