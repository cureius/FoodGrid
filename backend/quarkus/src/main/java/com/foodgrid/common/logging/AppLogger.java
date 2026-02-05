package com.foodgrid.common.logging;

import com.foodgrid.common.exception.ErrorCode;
import com.foodgrid.common.exception.FoodGridException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.Map;
import java.util.StringJoiner;

/**
 * Centralized application logger with structured logging support.
 * Provides consistent log formatting with correlation context.
 */
@ApplicationScoped
public class AppLogger {

    @Inject
    CorrelationContext correlationContext;

    /**
     * Log a debug message with context.
     */
    public void debug(final Logger log, final String message) {
        if (log.isDebugEnabled()) {
            log.debugf("%s %s", context(), message);
        }
    }

    /**
     * Log a debug message with context and parameters.
     */
    public void debug(final Logger log, final String message, final Object... params) {
        if (log.isDebugEnabled()) {
            log.debugf("%s " + message, prepend(context(), params));
        }
    }

    /**
     * Log an info message with context.
     */
    public void info(final Logger log, final String message) {
        log.infof("%s %s", context(), message);
    }

    /**
     * Log an info message with context and parameters.
     */
    public void info(final Logger log, final String message, final Object... params) {
        log.infof("%s " + message, prepend(context(), params));
    }

    /**
     * Log a warning message with context.
     */
    public void warn(final Logger log, final String message) {
        log.warnf("%s %s", context(), message);
    }

    /**
     * Log a warning message with context and parameters.
     */
    public void warn(final Logger log, final String message, final Object... params) {
        log.warnf("%s " + message, prepend(context(), params));
    }

    /**
     * Log an error message with context.
     */
    public void error(final Logger log, final String message) {
        log.errorf("%s %s", context(), message);
    }

    /**
     * Log an error message with context and parameters.
     */
    public void error(final Logger log, final String message, final Object... params) {
        log.errorf("%s " + message, prepend(context(), params));
    }

    /**
     * Log an error message with context and throwable.
     */
    public void error(final Logger log, final String message, final Throwable throwable) {
        log.errorf(throwable, "%s %s", context(), message);
    }

    /**
     * Log a FoodGridException with full context.
     */
    public void logException(final Logger log, final FoodGridException ex) {
        final String errorLog = formatException(ex);
        if (ex.getHttpStatus() >= 500) {
            log.errorf(ex, "%s %s", context(), errorLog);
        } else {
            log.warnf("%s %s", context(), errorLog);
        }
    }

    /**
     * Log an unexpected exception with full context.
     */
    public void logUnexpectedException(final Logger log, final Throwable ex, final String operation) {
        log.errorf(ex, "%s UNEXPECTED_ERROR during %s: %s", context(), operation, ex.getMessage());
    }

    /**
     * Log an API request.
     */
    public void logRequest(final Logger log, final String method, final String path, final Map<String, String> headers) {
        if (log.isDebugEnabled()) {
            log.debugf("%s REQUEST %s %s headers=%s", context(), method, path, sanitizeHeaders(headers));
        }
    }

    /**
     * Log an API response.
     */
    public void logResponse(final Logger log, final String method, final String path, final int status, final long durationMs) {
        if (status >= 500) {
            log.errorf("%s RESPONSE %s %s status=%d duration=%dms", context(), method, path, status, durationMs);
        } else if (status >= 400) {
            log.warnf("%s RESPONSE %s %s status=%d duration=%dms", context(), method, path, status, durationMs);
        } else {
            log.infof("%s RESPONSE %s %s status=%d duration=%dms", context(), method, path, status, durationMs);
        }
    }

    /**
     * Log an operation start.
     */
    public void logOperationStart(final Logger log, final String operation, final Map<String, Object> params) {
        if (log.isDebugEnabled()) {
            log.debugf("%s OPERATION_START %s params=%s", context(), operation, params);
        }
    }

    /**
     * Log an operation completion.
     */
    public void logOperationComplete(final Logger log, final String operation, final long durationMs) {
        log.infof("%s OPERATION_COMPLETE %s duration=%dms", context(), operation, durationMs);
    }

    /**
     * Log an operation failure.
     */
    public void logOperationFailed(final Logger log, final String operation, final String reason, final long durationMs) {
        log.warnf("%s OPERATION_FAILED %s reason=%s duration=%dms", context(), operation, reason, durationMs);
    }

    /**
     * Log an external service call.
     */
    public void logExternalCall(final Logger log, final String service, final String operation,
                                final int statusCode, final long durationMs) {
        if (statusCode >= 400) {
            log.warnf("%s EXTERNAL_CALL %s.%s status=%d duration=%dms",
                context(), service, operation, statusCode, durationMs);
        } else {
            log.infof("%s EXTERNAL_CALL %s.%s status=%d duration=%dms",
                context(), service, operation, statusCode, durationMs);
        }
    }

    /**
     * Log a database operation.
     */
    public void logDbOperation(final Logger log, final String operation, final String entity,
                               final String entityId, final long durationMs) {
        if (log.isDebugEnabled()) {
            log.debugf("%s DB_OP %s entity=%s id=%s duration=%dms",
                context(), operation, entity, entityId, durationMs);
        }
    }

    /**
     * Log a security event.
     */
    public void logSecurityEvent(final Logger log, final String event, final String details) {
        log.infof("%s SECURITY_EVENT %s details=%s", context(), event, details);
    }

    /**
     * Log a security warning.
     */
    public void logSecurityWarning(final Logger log, final String event, final String details) {
        log.warnf("%s SECURITY_WARNING %s details=%s", context(), event, details);
    }

    private String context() {
        try {
            return correlationContext.toLogContext();
        } catch (final Exception e) {
            return "[no-context]";
        }
    }

    private String formatException(final FoodGridException ex) {
        final StringJoiner sj = new StringJoiner(" ");
        sj.add("ERROR_CODE=" + ex.getErrorCode().getCode());
        sj.add("HTTP_STATUS=" + ex.getHttpStatus());
        sj.add("MESSAGE=" + ex.getMessage());
        if (ex.getDetails() != null) {
            sj.add("DETAILS=" + ex.getDetails());
        }
        return sj.toString();
    }

    private Map<String, String> sanitizeHeaders(final Map<String, String> headers) {
        if (headers == null) {
            return Map.of();
        }
        // Remove sensitive headers from logs
        final var sanitized = new java.util.HashMap<>(headers);
        sanitized.remove("Authorization");
        sanitized.remove("authorization");
        sanitized.remove("Cookie");
        sanitized.remove("cookie");
        return sanitized;
    }

    private Object[] prepend(final String prefix, final Object[] params) {
        final Object[] result = new Object[params.length + 1];
        result[0] = prefix;
        System.arraycopy(params, 0, result, 1, params.length);
        return result;
    }
}
