package com.foodgrid.payment.gateway;

import com.foodgrid.payment.model.GatewayTransactionStatus;

/**
 * Result from verifying/capturing a payment.
 */
public record GatewayVerifyResult(
    boolean success,
    GatewayTransactionStatus status,
    String gatewayPaymentId,
    String paymentMethod,
    String errorMessage,
    String rawResponse
) {
    public static GatewayVerifyResult success(final String gatewayPaymentId, final String paymentMethod, final String rawResponse) {
        return new GatewayVerifyResult(true, GatewayTransactionStatus.CAPTURED, gatewayPaymentId, paymentMethod, null, rawResponse);
    }

    public static GatewayVerifyResult failure(final String errorMessage, final String rawResponse) {
        return new GatewayVerifyResult(false, GatewayTransactionStatus.FAILED, null, null, errorMessage, rawResponse);
    }
}
