package com.foodgrid.common.multitenancy;

import com.foodgrid.auth.model.Outlet;
import com.foodgrid.auth.repo.OutletRepository;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.logging.Logger;

import java.util.Optional;

@Provider
@Priority(1000)
public class TenantFilter implements ContainerRequestFilter {
  private static final Logger LOG = Logger.getLogger(TenantFilter.class);

  @Inject
  TenantContext tenantContext;

  @Inject
  JsonWebToken jwt;

  @Inject
  OutletRepository outletRepository;

  @Override
  public void filter(final ContainerRequestContext requestContext) {
    final String path = requestContext.getUriInfo().getPath();

    // Allowlist: endpoints that are intentionally unauthenticated / not tenant scoped
    if (isPublicPath(path)) {
      return;
    }

    // For all other endpoints, tenant must be resolvable.
    if (jwt == null || jwt.getRawToken() == null) {
      abort(requestContext, Response.Status.UNAUTHORIZED, "Missing token");
      return;
    }

    // 1) Try clientId claim first
    final String clientId = jwt.getClaim("clientId");
    if (clientId != null && !clientId.isBlank()) {
      tenantContext.setTenantId(clientId);
      return;
    }

    // 2) If this is an admin token, allow tenant=subject (owner/tenant model)
    final String principalType = jwt.getClaim("principalType");
    final String subject = jwt.getSubject();
    if ("ADMIN".equalsIgnoreCase(principalType) && subject != null && !subject.isBlank()) {
      tenantContext.setTenantId(subject);
      return;
    }

    // 3) Fallback to outletId claim and resolve owner
    final String outletId = jwt.getClaim("outletId");
    if (outletId != null && !outletId.isBlank()) {
      final Optional<Outlet> maybeOutlet = outletRepository.findByIdOptional(outletId);
      if (maybeOutlet.isPresent()) {
        final Outlet o = maybeOutlet.get();
        final String resolvedClient = (o.clientId != null && !o.clientId.isBlank()) ? o.clientId : o.ownerId;
        if (resolvedClient != null && !resolvedClient.isBlank()) {
          tenantContext.setTenantId(resolvedClient);
          return;
        }
      } else {
        LOG.debugf("Outlet not found when resolving tenant: %s", outletId);
      }
    }

    LOG.debugf("Tenant context not resolved for request %s", path);
    abort(requestContext, Response.Status.FORBIDDEN, "Tenant not resolved");
  }

  private static boolean isPublicPath(final String path) {
    if (path == null) return true;
    final String p = path.startsWith("/") ? path.substring(1) : path;

    return p.startsWith("api/v1/auth")
      || p.startsWith("api/v1/admin/auth")
      || p.startsWith("api/v1/customer/auth")
      || p.startsWith("api/v1/public")
      || p.startsWith("api/v1/bootstrap")
      || p.startsWith("api/v1/pos/whoami")
      || p.startsWith("api/v1/webhooks/payment")  // Allow public access to payment webhooks
      || p.startsWith("uploads")  // Allow public access to uploaded files (images, etc.)
      || p.startsWith("q/")
      || p.startsWith("openapi")
      || p.startsWith("health")
      || p.startsWith("user");
  }

  private static void abort(final ContainerRequestContext ctx, final Response.Status status, final String message) {
    ctx.abortWith(Response.status(status)
      .entity(message)
      .build());
  }
}
