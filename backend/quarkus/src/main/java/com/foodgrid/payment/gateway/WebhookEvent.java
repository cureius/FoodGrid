package com.foodgrid.payment.gateway;

import java.util.Map;

/**
 * Parsed webhook event from gateway.
 */
public record WebhookEvent(
    String eventType,
    String gatewayOrderId,
    String gatewayPaymentId,
    String status,
    String paymentMethod,
    Map<String, Object> rawData
) {
    
    public static WebhookEvent paymentSuccess(String orderId, String paymentId, String rawData) {
        return new WebhookEvent("payment.success", orderId, paymentId, "success", null, Map.of("rawData", rawData));
    }
    
    public static WebhookEvent paymentFailed(String orderId, String paymentId, String status, String rawData) {
        return new WebhookEvent("payment.failed", orderId, paymentId, status, null, Map.of("rawData", rawData));
    }
    
    public static WebhookEvent refundSuccess(String paymentId, String refundId, String rawData) {
        return new WebhookEvent("refund.success", null, paymentId, "success", null, Map.of("refundId", refundId, "rawData", rawData));
    }
    
    public static WebhookEvent refundFailed(String paymentId, String refundId, String status, String rawData) {
        return new WebhookEvent("refund.failed", null, paymentId, status, null, Map.of("refundId", refundId, "rawData", rawData));
    }
    
    public static WebhookEvent unknown(String eventType, String rawData) {
        return new WebhookEvent(eventType, null, null, "unknown", null, Map.of("rawData", rawData));
    }
    
    public static WebhookEvent invalid(String errorMessage) {
        return new WebhookEvent("invalid", null, null, "error", null, Map.of("error", errorMessage));
    }
}
