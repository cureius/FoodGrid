package com.foodgrid.payment.rest;

import com.foodgrid.payment.model.PaymentGatewayType;

public record PaymentGatewayUpdateRequest (
        PaymentGatewayType defaultGatewayType,
        boolean paymentEnabled,
        boolean autoCaptureEnabled,
        boolean partialRefundEnabled,
        String webhookUrl,
        String paymentGatewayConfig
) {
}