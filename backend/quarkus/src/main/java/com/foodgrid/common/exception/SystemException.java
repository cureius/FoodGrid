package com.foodgrid.common.exception;

/**
 * Exception for system-level failures.
 * Maps to HTTP 500 Internal Server Error.
 */
public class SystemException extends FoodGridException {

    private final String component;

    public SystemException(final ErrorCode errorCode, final String message) {
        super(errorCode, message);
        this.component = null;
    }

    public SystemException(final ErrorCode errorCode, final String message, final Throwable cause) {
        super(errorCode, message, cause);
        this.component = null;
    }

    public SystemException(final ErrorCode errorCode, final String component, final String message) {
        super(errorCode, message, "Component: " + component);
        this.component = component;
    }

    public String getComponent() {
        return component;
    }

    public static SystemException internal(final String message) {
        return new SystemException(ErrorCode.SYS_INTERNAL_ERROR, message);
    }

    public static SystemException internal(final String message, final Throwable cause) {
        return new SystemException(ErrorCode.SYS_INTERNAL_ERROR, message, cause);
    }

    public static SystemException encryptionError(final String operation) {
        return new SystemException(ErrorCode.SYS_ENCRYPTION_ERROR, "Encryption", "Encryption operation failed: " + operation);
    }

    public static SystemException encryptionError(final String operation, final Throwable cause) {
        return new SystemException(ErrorCode.SYS_ENCRYPTION_ERROR, "Encryption operation failed: " + operation, cause);
    }

    public static SystemException configurationError(final String configKey, final String reason) {
        return new SystemException(ErrorCode.SYS_CONFIGURATION_ERROR, "Configuration",
            "Configuration error for " + configKey + ": " + reason);
    }

    public static SystemException unexpected(final Throwable cause) {
        return new SystemException(ErrorCode.SYS_UNEXPECTED_ERROR, "An unexpected error occurred", cause);
    }
}
