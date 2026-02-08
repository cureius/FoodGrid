package com.foodgrid.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodgrid.common.logging.CorrelationContext;
import io.smallrye.common.annotation.Blocking;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Provider
@Priority(5000)
@Blocking
public class EventLaggingFilter implements ContainerRequestFilter, ContainerResponseFilter {
    private static final Logger LOG = Logger.getLogger(EventLaggingFilter.class);
    private static final String START_TIME = EventLaggingFilter.class.getName() + ".startTime";
    private static final String REQUEST_BODY = EventLaggingFilter.class.getName() + ".requestBody";
    private static final String REQUEST_HEADERS = EventLaggingFilter.class.getName() + ".requestHeaders";

    @Inject
    CorrelationContext correlationContext;

    @Override
    public void filter(final ContainerRequestContext requestContext) {
        requestContext.setProperty(START_TIME, System.nanoTime());
        
        // Log request details
        logRequestDetails(requestContext);
        
        // Store request body for later logging (if it has an entity)
        if (requestContext.hasEntity()) {
            try {
                final ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                final InputStream inputStream = requestContext.getEntityStream();
                
                final byte[] data = new byte[1024];
                int nRead;
                while ((nRead = inputStream.read(data, 0, data.length)) != -1) {
                    buffer.write(data, 0, nRead);
                }
                
                buffer.flush();
                final byte[] requestBodyBytes = buffer.toByteArray();
                final String requestBody = new String(requestBodyBytes, StandardCharsets.UTF_8);
                
                // Store request body and headers for response logging
                requestContext.setProperty(REQUEST_BODY, requestBody);
                requestContext.setProperty(REQUEST_HEADERS, requestContext.getHeaders());
                
                // Reset the input stream so the application can read it
                requestContext.setEntityStream(new ByteArrayInputStream(requestBodyBytes));
            } catch (final IOException e) {
                LOG.error("Error reading request body for logging", e);
            }
        }
    }

    @Override
    public void filter(final ContainerRequestContext requestContext, final ContainerResponseContext responseContext) {
        final Object startObj = requestContext.getProperty(START_TIME);
        
        // Log response details
        logResponseDetails(requestContext, responseContext);
        
        final String correlationId = getCorrelationId();
        final int status = responseContext.getStatus();

        if (startObj instanceof final Long startTime) {
            final long durationNanos = System.nanoTime() - startTime;
            final double durationMs = durationNanos / 1_000_000.0;

            if (status >= 500) {
                LOG.errorf("[corrId=%s] %s %s -> %d (%.3f ms)",
                    correlationId,
                    requestContext.getMethod(),
                    requestContext.getUriInfo().getRequestUri().getPath(),
                    status,
                    durationMs
                );
            } else if (status >= 400) {
                LOG.warnf("[corrId=%s] %s %s -> %d (%.3f ms)",
                    correlationId,
                    requestContext.getMethod(),
                    requestContext.getUriInfo().getRequestUri().getPath(),
                    status,
                    durationMs
                );
            } else {
                LOG.infof("[corrId=%s] %s %s -> %d (%.3f ms)",
                    correlationId,
                    requestContext.getMethod(),
                    requestContext.getUriInfo().getRequestUri().getPath(),
                    status,
                    durationMs
                );
            }
        } else {
            LOG.infof("[corrId=%s] %s %s -> %d (no start time)",
                correlationId,
                requestContext.getMethod(),
                requestContext.getUriInfo().getRequestUri().getPath(),
                status
            );
        }
    }

    private String getCorrelationId() {
        try {
            return correlationContext.getCorrelationId();
        } catch (final Exception e) {
            return "unknown";
        }
    }
    
    private void logRequestDetails(final ContainerRequestContext requestContext) {
        final UriInfo uriInfo = requestContext.getUriInfo();

        final StringBuilder sb = new StringBuilder("=== REQUEST DETAILS ===\nMethod: ").append(requestContext.getMethod()).append("\nFull URI: ")
            .append(uriInfo.getRequestUri().toString()).append("\nPath: ").append(uriInfo.getPath()).append("\n");

        // Log path parameters
        final MultivaluedMap<String, String> pathParams = uriInfo.getPathParameters();
        if (!pathParams.isEmpty()) {
            sb.append("Path Parameters:\n");
            for (final Map.Entry<String, java.util.List<String>> entry : pathParams.entrySet()) {
                sb.append("  ").append(entry.getKey()).append(": ").append(String.join(", ", entry.getValue())).append("\n");
            }
        }

        // Log query parameters
        final MultivaluedMap<String, String> queryParams = uriInfo.getQueryParameters();
        if (!queryParams.isEmpty()) {
            sb.append("Query Parameters:\n");
            for (final Map.Entry<String, java.util.List<String>> entry : queryParams.entrySet()) {
                sb.append("  ").append(entry.getKey()).append(": ").append(String.join(", ", entry.getValue())).append("\n");
            }
        }

        // Log headers
        final MultivaluedMap<String, String> headers = requestContext.getHeaders();
        if (!headers.isEmpty()) {
            sb.append("Request Headers:\n");
            for (final Map.Entry<String, java.util.List<String>> entry : headers.entrySet()) {
                sb.append("  ").append(entry.getKey()).append(": ").append(String.join(", ", entry.getValue())).append("\n");
            }
        }

        sb.append("=== END REQUEST DETAILS ===");

        LOG.info(sb.toString());
    }
    
    private void logResponseDetails(final ContainerRequestContext requestContext, final ContainerResponseContext responseContext) {
        final StringBuilder sb = new StringBuilder("=== RESPONSE DETAILS ===\nStatus: ").append(responseContext.getStatus()).append("\n");

        // Add error context for unsuccessful responses
        final int status = responseContext.getStatus();
        if (status >= 400) {
            sb.append("ERROR TYPE: ");
            if (status >= 500) {
                sb.append("SERVER ERROR (5xx)\n");
            } else {
                sb.append("CLIENT ERROR (4xx)\n");
            }
        }

        // Log response headers
        final MultivaluedMap<String, Object> responseHeaders = responseContext.getHeaders();
        if (!responseHeaders.isEmpty()) {
            sb.append("Response Headers:\n");
            for (final Map.Entry<String, java.util.List<Object>> entry : responseHeaders.entrySet()) {
                sb.append("  ").append(entry.getKey()).append(": ").append(String.join(", ",
                    entry.getValue().stream().map(Object::toString).toList())).append("\n");
            }
        }

        // Log request body if it was stored
        final String requestBody = (String) requestContext.getProperty(REQUEST_BODY);
        if (requestBody != null && !requestBody.trim().isEmpty()) {
            sb.append("Request Body:\n").append(formatJson(requestBody)).append("\n");
        }

        // Log response entity if it exists and is reasonable size
        if (responseContext.hasEntity()) {
            try {
                final Object entity = responseContext.getEntity();
                if (entity != null) {
                    final String entityString = entity.toString();
                    sb.append("Response Body:\n").append(formatJson(entityString)).append("\n");
                }
            } catch (final Exception e) {
                sb.append("Response Body: [Unable to log - ").append(e.getMessage()).append("]\n");
            }
        } else {
            // For error responses, explicitly note if no response body is available
            if (status >= 400) {
                sb.append("Response Body: [No response entity available]\n");
            }
        }

        // Check if response status indicates an error (4xx or 5xx)
        if (status >= 400) {
            // Log as ERROR for unsuccessful responses
            LOG.error(sb.toString());
        } else {
            // Log as INFO for successful responses
            LOG.info(sb.toString());
        }
    }

    private String formatJson(final String json) {
        try {
            return new ObjectMapper().writerWithDefaultPrettyPrinter().writeValueAsString(new ObjectMapper().readValue(json, Object.class));
        } catch (final IOException e) {
            return json;
        }
    }
}

