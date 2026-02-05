package com.foodgrid.common.exception;

import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Standardized error response for all API errors.
 * Provides consistent error information for clients.
 */
public record ErrorResponse(
    String errorCode,
    String message,
    String details,
    String path,
    String method,
    String correlationId,
    Instant timestamp,
    Map<String, String> fieldErrors
) {

    public ErrorResponse {
        timestamp = timestamp != null ? timestamp : Instant.now();
        fieldErrors = fieldErrors != null ? Collections.unmodifiableMap(new HashMap<>(fieldErrors)) : null;
    }

    public static ErrorResponse of(final ErrorCode errorCode, final String message, final String path, final String method, final String correlationId) {
        return new ErrorResponse(
            errorCode.getCode(),
            message,
            null,
            path,
            method,
            correlationId,
            Instant.now(),
            null
        );
    }

    public static ErrorResponse of(final ErrorCode errorCode, final String message, final String details,
                                   final String path, final String method, final String correlationId) {
        return new ErrorResponse(
            errorCode.getCode(),
            message,
            details,
            path,
            method,
            correlationId,
            Instant.now(),
            null
        );
    }

    public static ErrorResponse of(final FoodGridException ex, final String path, final String method, final String correlationId) {
        Map<String, String> errors = null;
        if (ex instanceof ValidationException validationEx) {
            errors = validationEx.getFieldErrors().isEmpty() ? null : validationEx.getFieldErrors();
        }

        return new ErrorResponse(
            ex.getErrorCode().getCode(),
            ex.getMessage(),
            ex.getDetails(),
            path,
            method,
            correlationId,
            Instant.now(),
            errors
        );
    }

    public static ErrorResponse internalError(final String path, final String method, final String correlationId) {
        return new ErrorResponse(
            ErrorCode.SYS_INTERNAL_ERROR.getCode(),
            "An internal error occurred. Please try again later.",
            null,
            path,
            method,
            correlationId,
            Instant.now(),
            null
        );
    }
}
