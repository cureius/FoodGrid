package com.foodgrid.payment.gateway;

import com.foodgrid.payment.dto.GatewayCredentials;
import com.foodgrid.payment.model.PaymentGatewayType;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Payment Gateway interface - all gateway implementations must implement this.
 * This follows the Strategy pattern allowing the factory to return
 * the appropriate implementation based on client configuration.
 */
public interface PaymentGateway {

    /**
     * @return The gateway type this implementation handles
     */
    PaymentGatewayType getType();

    /**
     * Initialize gateway with credentials.
     * @param credentials Decrypted credentials for this gateway
     */
    void initialize(GatewayCredentials credentials);

    /**
     * Create a payment order with the gateway.
     *
     * @param orderId Internal order ID
     * @param amount Payment amount
     * @param currency Currency code (INR, USD, etc.)
     * @param receipt Receipt/reference string
     * @param notes Additional notes/metadata
     * @return Result containing gateway order ID and client-side data
     */
    GatewayOrderResult createOrder(String orderId, BigDecimal amount, String currency,
                                    String receipt, Map<String, String> notes);

    /**
     * Create a payment link using the gateway's payment links API.
     * This is used for generating shareable payment links.
     *
     * @param orderId Internal order ID
     * @param amount Payment amount
     * @param currency Currency code (INR, USD, etc.)
     * @param description Payment description
     * @param customerName Customer name (optional)
     * @param customerContact Customer contact (optional)
     * @param callbackUrl Callback URL for payment completion (optional)
     * @return Result containing payment link ID and client-side data
     */
    default GatewayOrderResult createPaymentLink(String orderId, BigDecimal amount, String currency,
                                                 String description, String customerName, 
                                                 String customerContact, String callbackUrl) {
        // Default implementation - gateways can override if they support payment links
        return GatewayOrderResult.failure("Payment links not supported by this gateway", null);
    }

    /**
     * Verify/capture a payment after client-side completion.
     *
     * @param gatewayOrderId Gateway's order ID
     * @param gatewayPaymentId Gateway's payment ID
     * @param gatewaySignature Signature for verification
     * @param additionalData Any additional verification data
     * @return Verification result
     */
    GatewayVerifyResult verifyPayment(String gatewayOrderId, String gatewayPaymentId,
                                       String gatewaySignature, Map<String, String> additionalData);

    /**
     * Process a refund.
     *
     * @param gatewayPaymentId Gateway's payment ID to refund
     * @param amount Amount to refund
     * @param reason Reason for refund
     * @return Refund result
     */
    GatewayRefundResult processRefund(String gatewayPaymentId, BigDecimal amount, String reason);

    /**
     * Parse and validate a webhook event.
     *
     * @param payload Raw webhook payload
     * @param signature Webhook signature header
     * @return Parsed webhook event
     */
    WebhookEvent parseWebhook(String payload, String signature);

    /**
     * Verify webhook signature.
     *
     * @param payload Raw webhook payload
     * @param signature Webhook signature
     * @return true if signature is valid
     */
    boolean verifyWebhookSignature(String payload, String signature);

    /**
     * Get the public key/key ID for client-side SDK initialization.
     * @return Public key or key ID
     */
    String getPublicKey();

    /**
     * Check if gateway supports automatic capture.
     * @return true if payments are auto-captured
     */
    default boolean supportsAutoCapture() {
        return true;
    }

    /**
     * Check if gateway supports partial refunds.
     * @return true if partial refunds are supported
     */
    default boolean supportsPartialRefund() {
        return true;
    }
}
