package com.foodgrid.payment.gateway;

import com.foodgrid.payment.model.RefundStatus;

/**
 * Result from processing a refund.
 */
public record GatewayRefundResult(
    boolean success,
    RefundStatus status,
    String gatewayRefundId,
    String errorMessage,
    String rawResponse
) {
    public static GatewayRefundResult success(final String gatewayRefundId, final String rawResponse) {
        return new GatewayRefundResult(true, RefundStatus.COMPLETED, gatewayRefundId, null, rawResponse);
    }

    public static GatewayRefundResult processing(final String gatewayRefundId, final String rawResponse) {
        return new GatewayRefundResult(true, RefundStatus.PROCESSING, gatewayRefundId, null, rawResponse);
    }

    public static GatewayRefundResult failure(final String errorMessage, final String rawResponse) {
        return new GatewayRefundResult(false, RefundStatus.FAILED, null, errorMessage, rawResponse);
    }
}
