package com.foodgrid.common.exception;

/**
 * Base exception for all FoodGrid application exceptions.
 * Provides structured error information for consistent API responses.
 */
public abstract class FoodGridException extends RuntimeException {

    private final ErrorCode errorCode;
    private final String details;

    protected FoodGridException(final ErrorCode errorCode, final String message) {
        super(message);
        this.errorCode = errorCode;
        this.details = null;
    }

    protected FoodGridException(final ErrorCode errorCode, final String message, final String details) {
        super(message);
        this.errorCode = errorCode;
        this.details = details;
    }

    protected FoodGridException(final ErrorCode errorCode, final String message, final Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.details = cause != null ? cause.getMessage() : null;
    }

    protected FoodGridException(final ErrorCode errorCode, final String message, final String details, final Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.details = details;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public String getDetails() {
        return details;
    }

    public int getHttpStatus() {
        return errorCode.getHttpStatus();
    }
}
