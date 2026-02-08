package com.foodgrid.common.exception;

import com.foodgrid.common.logging.AppLogger;
import com.foodgrid.common.logging.CorrelationContext;
import jakarta.inject.Inject;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception mapper that handles all exceptions and converts them
 * to standardized error responses with proper logging.
 */
@Provider
public class GlobalExceptionMapper implements ExceptionMapper<Throwable> {

    private static final Logger LOG = Logger.getLogger(GlobalExceptionMapper.class);

    @Context
    UriInfo uriInfo;

    @Inject
    CorrelationContext correlationContext;

    @Inject
    AppLogger appLogger;

    @Override
    public Response toResponse(final Throwable exception) {
        final String path = uriInfo != null ? uriInfo.getPath() : "unknown";
        final String method = uriInfo != null ? uriInfo.getRequestUri().toString() : "unknown";
        final String correlationId = getCorrelationId();

        // Handle FoodGrid application exceptions
        if (exception instanceof FoodGridException fgEx) {
            return handleFoodGridException(fgEx, path, method, correlationId);
        }

        // Handle JAX-RS standard exceptions
        if (exception instanceof WebApplicationException webEx) {
            return handleWebApplicationException(webEx, path, method, correlationId);
        }

        // Handle Bean Validation exceptions
        if (exception instanceof ConstraintViolationException cve) {
            return handleConstraintViolation(cve, path, method, correlationId);
        }

        // Handle IllegalArgumentException as validation error
        if (exception instanceof IllegalArgumentException) {
            return handleIllegalArgument((IllegalArgumentException) exception, path, method, correlationId);
        }

        // Handle unexpected exceptions
        return handleUnexpectedException(exception, path, method, correlationId);
    }

    private Response handleFoodGridException(final FoodGridException ex, final String path,
                                             final String method, final String correlationId) {
        appLogger.logException(LOG, ex);

        final ErrorResponse errorResponse = ErrorResponse.of(ex, path, method, correlationId);

        return Response.status(ex.getHttpStatus())
            .entity(errorResponse)
            .type(MediaType.APPLICATION_JSON)
            .header("X-Correlation-ID", correlationId)
            .build();
    }

    private Response handleWebApplicationException(final WebApplicationException ex, final String path,
                                                   final String method, final String correlationId) {
        final ErrorCode errorCode = mapWebExceptionToErrorCode(ex);
        final String message = ex.getMessage() != null ? ex.getMessage() : errorCode.getDefaultMessage();

        // Log based on status code
        final int status = ex.getResponse().getStatus();
        if (status >= 500) {
            LOG.errorf("[corrId=%s] WebApplicationException: status=%d message=%s",
                correlationId, status, message);
        } else if (status >= 400) {
            LOG.warnf("[corrId=%s] WebApplicationException: status=%d message=%s",
                correlationId, status, message);
        }

        final ErrorResponse errorResponse = ErrorResponse.of(errorCode, message, path, method, correlationId);

        return Response.status(status)
            .entity(errorResponse)
            .type(MediaType.APPLICATION_JSON)
            .header("X-Correlation-ID", correlationId)
            .build();
    }

    private Response handleConstraintViolation(final ConstraintViolationException ex, final String path,
                                               final String method, final String correlationId) {
        final Map<String, String> fieldErrors = new HashMap<>();
        for (final ConstraintViolation<?> violation : ex.getConstraintViolations()) {
            final String field = getFieldName(violation);
            fieldErrors.put(field, violation.getMessage());
        }

        LOG.warnf("[corrId=%s] ConstraintViolationException: fields=%s", correlationId, fieldErrors.keySet());

        final ErrorResponse errorResponse = new ErrorResponse(
            ErrorCode.VAL_INVALID_INPUT.getCode(),
            "Validation failed",
            "One or more fields have invalid values",
            path,
            method,
            correlationId,
            null,
            fieldErrors
        );

        return Response.status(Response.Status.BAD_REQUEST)
            .entity(errorResponse)
            .type(MediaType.APPLICATION_JSON)
            .header("X-Correlation-ID", correlationId)
            .build();
    }

    private Response handleIllegalArgument(final IllegalArgumentException ex, final String path,
                                           final String method, final String correlationId) {
        LOG.warnf("[corrId=%s] IllegalArgumentException: %s", correlationId, ex.getMessage());

        final ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.VAL_INVALID_INPUT,
            ex.getMessage() != null ? ex.getMessage() : "Invalid argument",
            path,
            method,
            correlationId
        );

        return Response.status(Response.Status.BAD_REQUEST)
            .entity(errorResponse)
            .type(MediaType.APPLICATION_JSON)
            .header("X-Correlation-ID", correlationId)
            .build();
    }

    private Response handleUnexpectedException(final Throwable ex, final String path,
                                               final String method, final String correlationId) {
        // Log the full stack trace for unexpected exceptions
        LOG.errorf(ex, "[corrId=%s] Unexpected exception: %s", correlationId, ex.getMessage());

        // Don't expose internal details to client
        final ErrorResponse errorResponse = ErrorResponse.internalError(path, method, correlationId);

        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
            .entity(errorResponse)
            .type(MediaType.APPLICATION_JSON)
            .header("X-Correlation-ID", correlationId)
            .build();
    }

    private ErrorCode mapWebExceptionToErrorCode(final WebApplicationException ex) {
        if (ex instanceof NotFoundException) {
            return ErrorCode.RES_NOT_FOUND;
        } else if (ex instanceof BadRequestException) {
            return ErrorCode.VAL_INVALID_INPUT;
        } else if (ex instanceof ForbiddenException) {
            return ErrorCode.AUTHZ_ACCESS_DENIED;
        } else if (ex instanceof jakarta.ws.rs.NotAuthorizedException) {
            return ErrorCode.AUTH_MISSING_TOKEN;
        }

        final int status = ex.getResponse().getStatus();
        return switch (status) {
            case 400 -> ErrorCode.VAL_INVALID_INPUT;
            case 401 -> ErrorCode.AUTH_MISSING_TOKEN;
            case 403 -> ErrorCode.AUTHZ_ACCESS_DENIED;
            case 404 -> ErrorCode.RES_NOT_FOUND;
            case 409 -> ErrorCode.BIZ_DUPLICATE_ENTRY;
            default -> ErrorCode.SYS_INTERNAL_ERROR;
        };
    }

    private String getFieldName(final ConstraintViolation<?> violation) {
        final String propertyPath = violation.getPropertyPath().toString();
        // Extract the last part of the path (the actual field name)
        final int lastDot = propertyPath.lastIndexOf('.');
        return lastDot >= 0 ? propertyPath.substring(lastDot + 1) : propertyPath;
    }

    private String getCorrelationId() {
        try {
            return correlationContext.getCorrelationId();
        } catch (final Exception e) {
            // Fallback if correlation context is not available
            return java.util.UUID.randomUUID().toString().substring(0, 16);
        }
    }
}
