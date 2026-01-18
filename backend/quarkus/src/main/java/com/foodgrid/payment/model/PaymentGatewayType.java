package com.foodgrid.payment.model;

/**
 * Supported payment gateway types.
 * Each client can configure their preferred gateway.
 */
public enum PaymentGatewayType {
    RAZORPAY("Razorpay", "INR"),
    STRIPE("Stripe", "USD"),
    PAYU("PayU", "INR"),
    PHONEPE("PhonePe", "INR"),
    CASHFREE("Cashfree", "INR");

    private final String displayName;
    private final String defaultCurrency;

    PaymentGatewayType(final String displayName, final String defaultCurrency) {
        this.displayName = displayName;
        this.defaultCurrency = defaultCurrency;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDefaultCurrency() {
        return defaultCurrency;
    }
}
