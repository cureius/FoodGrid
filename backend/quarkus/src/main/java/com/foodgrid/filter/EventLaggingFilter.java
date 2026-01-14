package com.foodgrid.filter;

import jakarta.annotation.Priority;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

@Provider
@Priority(5000)
public class EventLaggingFilter implements ContainerRequestFilter, ContainerResponseFilter {
    private static final Logger LOG = Logger.getLogger(EventLaggingFilter.class);
    private static final String START_TIME = EventLaggingFilter.class.getName() + ".startTime";

    @Override
    public void filter(final ContainerRequestContext requestContext) {
        requestContext.setProperty(START_TIME, System.nanoTime());
    }

    @Override
    public void filter(final ContainerRequestContext requestContext, final ContainerResponseContext responseContext) {
        final Object startObj = requestContext.getProperty(START_TIME);
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
}

