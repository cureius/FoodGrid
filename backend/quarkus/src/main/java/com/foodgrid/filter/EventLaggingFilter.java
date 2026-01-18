package com.foodgrid.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Priority;
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
public class EventLaggingFilter implements ContainerRequestFilter, ContainerResponseFilter {
    private static final Logger LOG = Logger.getLogger(EventLaggingFilter.class);
    private static final String START_TIME = EventLaggingFilter.class.getName() + ".startTime";
    private static final String REQUEST_BODY = EventLaggingFilter.class.getName() + ".requestBody";
    private static final String REQUEST_HEADERS = EventLaggingFilter.class.getName() + ".requestHeaders";

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
        
        if (startObj instanceof final Long startTime) {
            final long durationNanos = System.nanoTime() - startTime;
            final double durationMs = durationNanos / 1_000_000.0;
            LOG.infof(
                "EventLagging: %s %s -> %d (%.3f ms)",
                requestContext.getMethod(),
                requestContext.getUriInfo().getRequestUri().getPath(),
                responseContext.getStatus(),
                durationMs
            );
        } else {
            LOG.infof(
                "EventLagging: %s %s -> %d (no start time)",
                requestContext.getMethod(),
                requestContext.getUriInfo().getRequestUri().getPath(),
                responseContext.getStatus()
            );
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
        }

        LOG.info(sb.toString());
    }

    private String formatJson(final String json) {
        try {
            return new ObjectMapper().writerWithDefaultPrettyPrinter().writeValueAsString(new ObjectMapper().readValue(json, Object.class));
        } catch (final IOException e) {
            return json;
        }
    }
}

