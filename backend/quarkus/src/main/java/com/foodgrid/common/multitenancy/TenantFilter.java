package com.foodgrid.common.multitenancy;

import com.foodgrid.auth.model.Outlet;
import com.foodgrid.auth.repo.OutletRepository;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;
import org.eclipse.microprofile.jwt.JsonWebToken;

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
    // Skip tenant resolution for unauthenticated requests (bootstrap, login, etc.)
    if (jwt == null || jwt.getRawToken() == null) {
      return;
    }

    // 1) Try clientId claim first
    final String clientId = jwt.getClaim("clientId");
    if (clientId != null && !clientId.isBlank()) {
      tenantContext.setTenantId(clientId);
      return;
    }

    // 2) Fallback to outletId claim and resolve owner
    final String outletId = jwt.getClaim("outletId");
    if (outletId != null && !outletId.isBlank()) {
      final Optional<Outlet> maybeOutlet = outletRepository.findByIdOptional(outletId);
      if (maybeOutlet.isPresent()) {
        final Outlet o = maybeOutlet.get();
        // Prefer clientId if set, else fallback to ownerId
        final String resolvedClient = (o.clientId != null && !o.clientId.isBlank()) ? o.clientId : o.ownerId;
        if (resolvedClient != null && !resolvedClient.isBlank()) {
          tenantContext.setTenantId(resolvedClient);
          return;
        }
      } else {
        LOG.debugf("Outlet not found when resolving tenant: %s", outletId);
      }
    }

    // 3) If still not resolved, allow request through (tenant enforcement can be done at service level)
    // This is more lenient to avoid blocking admin/bootstrap flows
    LOG.debugf("Tenant context not resolved for request %s", requestContext.getUriInfo().getPath());
  }
}
