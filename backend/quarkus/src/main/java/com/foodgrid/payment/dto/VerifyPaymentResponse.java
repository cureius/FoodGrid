package com.foodgrid.payment.dto;

import com.foodgrid.payment.model.GatewayTransactionStatus;
import com.foodgrid.payment.model.PaymentGatewayType;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Response after verifying a payment.
 */
public record VerifyPaymentResponse(
    String transactionId,
    String orderId,
    PaymentGatewayType gatewayType,
    String gatewayOrderId,
    String gatewayPaymentId,
    BigDecimal amount,
    String currency,
    GatewayTransactionStatus status,
    String paymentMethod,
    boolean success,
    String errorMessage
) {
    public static VerifyPaymentResponse success(final GatewayTransactionResponse tx) {
        return new VerifyPaymentResponse(
            tx.id(), tx.orderId(), tx.gatewayType(), tx.gatewayOrderId(), tx.gatewayPaymentId(),
            tx.amount(), tx.currency(), tx.status(), tx.paymentMethod(), true, null
        );
    }

    public static VerifyPaymentResponse failure(final String transactionId, final String errorMessage) {
        return new VerifyPaymentResponse(
            transactionId, null, null, null, null, null, null,
            GatewayTransactionStatus.FAILED, null, false, errorMessage
        );
    }
}
