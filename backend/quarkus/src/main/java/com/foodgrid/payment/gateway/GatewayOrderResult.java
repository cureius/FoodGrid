package com.foodgrid.payment.gateway;

import com.foodgrid.payment.model.GatewayTransactionStatus;

import java.util.Map;

/**
 * Result from creating a payment order with the gateway.
 */
public record GatewayOrderResult(
    boolean success,
    String gatewayOrderId,
    GatewayTransactionStatus status,
    Map<String, Object> clientData,
    String errorMessage,
    String rawResponse
) {
    public static GatewayOrderResult success(final String gatewayOrderId, final Map<String, Object> clientData, final String rawResponse) {
        return new GatewayOrderResult(true, gatewayOrderId, GatewayTransactionStatus.PENDING, clientData, null, rawResponse);
    }

    public static GatewayOrderResult failure(final String errorMessage, final String rawResponse) {
        return new GatewayOrderResult(false, null, GatewayTransactionStatus.FAILED, null, errorMessage, rawResponse);
    }
}
