package com.foodgrid.common.logging;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.logging.MDC;

/**
 * Filter that sets up correlation context for each request.
 * Extracts correlation ID from headers or generates a new one.
 * Also extracts user context from JWT for logging.
 */
@Provider
@Priority(100) // Run early to set up context
public class CorrelationFilter implements ContainerRequestFilter, ContainerResponseFilter {

    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    private static final String REQUEST_ID_HEADER = "X-Request-ID";

    @Inject
    CorrelationContext correlationContext;

    @Inject
    JsonWebToken jwt;

    @Override
    public void filter(final ContainerRequestContext requestContext) {
        // Extract or generate correlation ID
        String correlationId = requestContext.getHeaderString(CORRELATION_ID_HEADER);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = requestContext.getHeaderString(REQUEST_ID_HEADER);
        }

        if (correlationId != null && !correlationId.isBlank()) {
            correlationContext.setCorrelationId(correlationId);
        }
        // Otherwise it will be generated on first access

        // Set MDC for logging framework
        MDC.put("correlationId", correlationContext.getCorrelationId());

        // Extract user context from JWT if available
        if (jwt != null && jwt.getRawToken() != null) {
            final String subject = jwt.getSubject();
            if (subject != null) {
                correlationContext.setUserId(subject);
                MDC.put("userId", subject);
            }

            final Object principalType = jwt.getClaim("principalType");
            if (principalType != null) {
                correlationContext.setUserType(principalType.toString());
                MDC.put("userType", principalType.toString());
            }

            final Object clientId = jwt.getClaim("clientId");
            if (clientId != null) {
                correlationContext.setTenantId(clientId.toString());
                MDC.put("tenantId", clientId.toString());
            }

            final Object outletId = jwt.getClaim("outletId");
            if (outletId != null) {
                correlationContext.setOutletId(outletId.toString());
                MDC.put("outletId", outletId.toString());
            }
        }
    }

    @Override
    public void filter(final ContainerRequestContext requestContext, final ContainerResponseContext responseContext) {
        // Add correlation ID to response headers for client tracing
        responseContext.getHeaders().putSingle(CORRELATION_ID_HEADER, correlationContext.getCorrelationId());

        // Clear MDC after request
        MDC.clear();
    }
}
