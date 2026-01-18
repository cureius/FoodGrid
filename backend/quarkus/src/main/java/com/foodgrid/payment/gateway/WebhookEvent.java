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
) {}
