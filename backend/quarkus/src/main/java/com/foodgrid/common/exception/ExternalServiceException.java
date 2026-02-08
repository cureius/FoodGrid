package com.foodgrid.common.exception;

/**
 * Exception for external service failures.
 * Maps to HTTP 502/503/504 depending on the type of failure.
 */
public class ExternalServiceException extends FoodGridException {

    private final String serviceName;
    private final String operationType;

    public ExternalServiceException(final ErrorCode errorCode, final String message) {
        super(errorCode, message);
        this.serviceName = null;
        this.operationType = null;
    }

    public ExternalServiceException(final ErrorCode errorCode, final String serviceName, final String operationType, final String message) {
        super(errorCode, message, "Service: " + serviceName + ", Operation: " + operationType);
        this.serviceName = serviceName;
        this.operationType = operationType;
    }

    public ExternalServiceException(final ErrorCode errorCode, final String message, final Throwable cause) {
        super(errorCode, message, cause);
        this.serviceName = null;
        this.operationType = null;
    }

    public String getServiceName() {
        return serviceName;
    }

    public String getOperationType() {
        return operationType;
    }

    public static ExternalServiceException unavailable(final String serviceName) {
        return new ExternalServiceException(ErrorCode.EXT_SERVICE_UNAVAILABLE, "Service unavailable: " + serviceName);
    }

    public static ExternalServiceException timeout(final String serviceName, final String operation) {
        return new ExternalServiceException(ErrorCode.EXT_TIMEOUT, serviceName, operation,
            "Request to " + serviceName + " timed out during " + operation);
    }

    public static ExternalServiceException channelError(final String channelName, final String operation, final String reason) {
        return new ExternalServiceException(ErrorCode.EXT_CHANNEL_ERROR, channelName, operation,
            "Channel integration error: " + reason);
    }

    public static ExternalServiceException emailFailed(final String recipient, final String reason) {
        return new ExternalServiceException(ErrorCode.EXT_EMAIL_FAILED, "Email", "send",
            "Failed to send email to " + recipient + ": " + reason);
    }

    public static ExternalServiceException emailFailed(final String recipient, final Throwable cause) {
        return new ExternalServiceException(ErrorCode.EXT_EMAIL_FAILED,
            "Failed to send email to " + recipient, cause);
    }
}
