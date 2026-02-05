package com.foodgrid.common.exception;

/**
 * Exception for payment-related failures.
 * Maps to HTTP 400 or 502 depending on whether it's a validation or gateway error.
 */
public class PaymentException extends FoodGridException {

    private final String gatewayType;
    private final String transactionId;

    public PaymentException(final ErrorCode errorCode, final String message) {
        super(errorCode, message);
        this.gatewayType = null;
        this.transactionId = null;
    }

    public PaymentException(final ErrorCode errorCode, final String message, final String details) {
        super(errorCode, message, details);
        this.gatewayType = null;
        this.transactionId = null;
    }

    public PaymentException(final ErrorCode errorCode, final String message, final String gatewayType, final String transactionId) {
        super(errorCode, message, "Gateway: " + gatewayType + ", Transaction: " + transactionId);
        this.gatewayType = gatewayType;
        this.transactionId = transactionId;
    }

    public PaymentException(final ErrorCode errorCode, final String message, final Throwable cause) {
        super(errorCode, message, cause);
        this.gatewayType = null;
        this.transactionId = null;
    }

    public String getGatewayType() {
        return gatewayType;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public static PaymentException gatewayError(final String gatewayType, final String message) {
        return new PaymentException(ErrorCode.PAY_GATEWAY_ERROR, "Payment gateway error: " + message, gatewayType, null);
    }

    public static PaymentException gatewayError(final String gatewayType, final String message, final Throwable cause) {
        return new PaymentException(ErrorCode.PAY_GATEWAY_ERROR, "Payment gateway error: " + message, cause);
    }

    public static PaymentException initiationFailed(final String orderId, final String reason) {
        return new PaymentException(ErrorCode.PAY_INITIATION_FAILED, "Payment initiation failed for order: " + orderId, reason);
    }

    public static PaymentException verificationFailed(final String transactionId, final String reason) {
        return new PaymentException(ErrorCode.PAY_VERIFICATION_FAILED, "Payment verification failed", reason);
    }

    public static PaymentException refundFailed(final String transactionId, final String reason) {
        return new PaymentException(ErrorCode.PAY_REFUND_FAILED, "Refund processing failed for transaction: " + transactionId, reason);
    }

    public static PaymentException invalidWebhook(final String gatewayType) {
        return new PaymentException(ErrorCode.PAY_WEBHOOK_INVALID, "Invalid webhook signature from " + gatewayType);
    }

    public static PaymentException configMissing(final String clientId) {
        return new PaymentException(ErrorCode.PAY_CONFIG_MISSING, "Payment gateway not configured for client: " + clientId);
    }

    public static PaymentException captureFailed(final String paymentId, final String reason) {
        return new PaymentException(ErrorCode.PAY_CAPTURE_FAILED, "Payment capture failed for: " + paymentId, reason);
    }
}
