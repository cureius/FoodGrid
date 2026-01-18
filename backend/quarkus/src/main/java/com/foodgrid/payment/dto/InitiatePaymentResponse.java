package com.foodgrid.payment.dto;

import com.foodgrid.payment.model.GatewayTransactionStatus;
import com.foodgrid.payment.model.PaymentGatewayType;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Response after initiating a payment - contains data needed by client-side SDK.
 */
public record InitiatePaymentResponse(
    String transactionId,
    String orderId,
    PaymentGatewayType gatewayType,
    String gatewayOrderId,
    BigDecimal amount,
    String currency,
    GatewayTransactionStatus status,
    /** Gateway-specific client data for SDK initialization */
    Map<String, Object> clientData,
    /** Public key/key ID for SDK */
    String gatewayPublicKey
) {}
