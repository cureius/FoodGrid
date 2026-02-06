package com.foodgrid.demo.filter;

import com.foodgrid.common.exception.ErrorCode;
import com.foodgrid.common.exception.ErrorResponse;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.logging.Logger;

import java.util.Set;

@Provider
@Priority(2000) // Run after Auth filters
public class DemoModeFilter implements ContainerRequestFilter {
    private static final Logger LOG = Logger.getLogger(DemoModeFilter.class);
    private static final String DEMO_OUTLET_ID = "demo-outlet-1";
    
    // Blocked paths for POST/PUT in demo mode
    private static final Set<String> BLOCKED_PATH_PREFIXES = Set.of(
        "/api/v1/integrations",
        "/api/v1/exports", 
        "/api/v1/settlements"
    );

    @Inject
    JsonWebToken jwt;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        // Quick check: is there a token?
        if (jwt == null || jwt.getRawToken() == null) {
            return;
        }

        // Check if user is operating in demo context
        String outletId = jwt.getClaim("outletId");
        if (!DEMO_OUTLET_ID.equals(outletId)) {
            return;
        }

        String method = requestContext.getMethod();
        String path = requestContext.getUriInfo().getPath();

        // 1. Block ALL DELETE operations in demo mode
        if ("DELETE".equalsIgnoreCase(method)) {
            abort(requestContext, method, path);
            return;
        }

        // 2. Block specific destructive POST/PUT operations
        if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method)) {
             for (String blockedPath : BLOCKED_PATH_PREFIXES) {
                 if (path.startsWith(blockedPath)) {
                     abort(requestContext, method, path);
                     return;
                 }
             }
        }
    }

    private void abort(ContainerRequestContext ctx, String method, String path) {
        LOG.warnf("Blocked destructive operation in DEMO mode: %s %s", method, path);
        
        ctx.abortWith(Response.status(Response.Status.FORBIDDEN)
            .entity(ErrorResponse.of(
                ErrorCode.AUTHZ_ACCESS_DENIED, 
                "This operation is disabled in DEMO mode to preserve data integrity.", 
                path, 
                method, 
                "demo-restriction"
            ))
            .type(MediaType.APPLICATION_JSON)
            .build());
    }
}
