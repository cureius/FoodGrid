package com.foodgrid.payment.dto;

import com.foodgrid.payment.model.PaymentGatewayType;

/**
 * Decrypted gateway credentials for runtime use.
 * Never log or persist this in plain text.
 */
public record GatewayCredentials(
    PaymentGatewayType gatewayType,
    String apiKey,
    String secretKey,
    String webhookSecret,
    String merchantId,
    boolean isLiveMode,
    String additionalConfig
) {
    /**
     * Get the base URL based on live/test mode.
     */
    public String getBaseUrl() {
        return switch (gatewayType) {
            case RAZORPAY -> isLiveMode ? "https://api.razorpay.com/v1" : "https://api.razorpay.com/v1";
            case STRIPE -> "https://api.stripe.com/v1";
            case PAYU -> isLiveMode ? "https://secure.payu.in" : "https://sandboxsecure.payu.in";
            case PHONEPE -> isLiveMode ? "https://api.phonepe.com/apis/hermes" : "https://api-preprod.phonepe.com/apis/pg-sandbox";
            case CASHFREE -> isLiveMode ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
        };
    }
}
