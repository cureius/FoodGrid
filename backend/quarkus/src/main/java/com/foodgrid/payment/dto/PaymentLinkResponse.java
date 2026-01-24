package com.foodgrid.payment.dto;

import com.foodgrid.payment.model.GatewayTransactionStatus;
import com.foodgrid.payment.model.PaymentGatewayType;

import java.math.BigDecimal;

/**
 * Response containing payment link for an order.
 */
public record PaymentLinkResponse(
    String transactionId,
    String orderId,
    PaymentGatewayType gatewayType,
    String gatewayOrderId,
    String paymentLink,
    BigDecimal amount,
    String currency,
    GatewayTransactionStatus status
) {}
