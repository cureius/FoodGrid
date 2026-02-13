package com.foodgrid.common.multitenancy;

import com.foodgrid.auth.model.Outlet;
import com.foodgrid.auth.repo.OutletRepository;
import com.foodgrid.common.exception.ErrorCode;
import com.foodgrid.common.exception.ErrorResponse;
import com.foodgrid.common.logging.CorrelationContext;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.MediaType;
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

  @Inject
  CorrelationContext correlationContext;

  @Override
  public void filter(final ContainerRequestContext requestContext) {
    final String path = requestContext.getUriInfo().getPath();

    // Allowlist: endpoints that are intentionally unauthenticated / not tenant scoped
    if (isPublicPath(path)) {
      return;
    }

    // For all other endpoints, tenant must be resolvable.
    if (jwt == null || jwt.getRawToken() == null) {
      abort(requestContext, Response.Status.UNAUTHORIZED, ErrorCode.AUTH_MISSING_TOKEN);
      return;
    }

    // 1) Try clientId claim first
    final String clientId = jwt.getClaim("clientId");
    if (clientId != null && !clientId.isBlank()) {
      LOG.infof("Resolved tenant from clientId claim: %s", clientId);
      tenantContext.setTenantId(clientId);
      return;
    }

    // 2) If this is an admin token, allow tenant=subject (owner/tenant model)
    final String principalType = jwt.getClaim("principalType");
    final String subject = jwt.getSubject();
    if ("ADMIN".equalsIgnoreCase(principalType) && subject != null && !subject.isBlank()) {
      LOG.infof("Resolved tenant from ADMIN subject: %s", subject);
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
    abort(requestContext, Response.Status.FORBIDDEN, ErrorCode.AUTHZ_TENANT_MISMATCH);
  }

  private static boolean isPublicPath(final String path) {
    if (path == null || path.isEmpty() || path.equals("/")) return true;
    final String p = path.startsWith("/") ? path.substring(1) : path;

    return p.isEmpty()
      || p.startsWith("api/v1/auth")
      || p.startsWith("api/v1/admin/auth")
      || p.startsWith("api/v1/customer")
      || p.startsWith("api/v1/public")
      || p.startsWith("api/v1/bootstrap")
      || p.startsWith("api/v1/demo")
      || p.startsWith("api/v1/pos/whoami")
      || p.startsWith("api/v1/webhooks/payment")  // Allow public access to payment webhooks
      || p.startsWith("uploads")  // Allow public access to uploaded files (images, etc.)
      || p.startsWith("q/")
      || p.startsWith("openapi")
      || p.startsWith("health")
      || p.startsWith("api/v1/demo")
      || p.startsWith("user");
  }

  private void abort(final ContainerRequestContext ctx, final Response.Status status, final ErrorCode errorCode) {
    final String path = ctx.getUriInfo().getPath();
    final String method = ctx.getMethod();
    String correlationId;
    try {
      correlationId = correlationContext.getCorrelationId();
    } catch (final Exception e) {
      correlationId = "unknown";
    }

    final ErrorResponse errorResponse = ErrorResponse.of(errorCode, errorCode.getDefaultMessage(), path, method, correlationId);

    LOG.warnf("[corrId=%s] TenantFilter abort: %s %s -> %s", correlationId, method, path, errorCode.getCode());

    ctx.abortWith(Response.status(status)
      .entity(errorResponse)
      .type(MediaType.APPLICATION_JSON)
      .header("X-Correlation-ID", correlationId)
      .build());
  }
}
