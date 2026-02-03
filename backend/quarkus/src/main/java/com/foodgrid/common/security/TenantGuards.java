package com.foodgrid.common.security;

import com.foodgrid.auth.model.Outlet;
import com.foodgrid.auth.repo.OutletRepository;
import com.foodgrid.common.multitenancy.TenantContext;
import io.quarkus.security.identity.SecurityIdentity;
import org.eclipse.microprofile.jwt.JsonWebToken;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;

/**
 * Centralized authorization helpers to keep tenant/outlet checks consistent.
 */
@ApplicationScoped
public class TenantGuards {

  @Inject TenantContext tenantContext;
  @Inject OutletRepository outletRepository;
  @Inject SecurityIdentity identity;
  @Inject JsonWebToken jwt;

  /**
   * @return resolved tenant id from TenantContext; throws if missing.
   */
  public String requireTenant() {
    if (!tenantContext.hasTenant()) {
      throw new ForbiddenException("Tenant not resolved");
    }
    return tenantContext.getTenantId();
  }

  /**
   * Ensures outlet belongs to current tenant.
   */
  public Outlet requireOutletInTenant(final String outletId) {
    if (outletId == null || outletId.isBlank()) {
      throw new NotFoundException("Outlet not found");
    }

    final Outlet outlet = outletRepository.findByIdOptional(outletId)
      .orElseThrow(() -> new NotFoundException("Outlet not found"));

    final String tenantId = requireTenant();
    final String outletTenant = (outlet.clientId != null && !outlet.clientId.isBlank()) ? outlet.clientId : outlet.ownerId;

    if (outletTenant == null || outletTenant.isBlank() || !outletTenant.equals(tenantId)) {
      // Fallback: If tenant check failed, allow if the current user is specifically the ownerId of this outlet.
      // This handles cases where an owner has a clientId in their token but the outlet record still uses ownerId.
      final String sub = claim("sub");
      if (sub != null && !sub.isBlank() && sub.equals(outlet.ownerId)) {
        return outlet;
      }
      
      // Log details of the failure to help debug 403 errors
      org.jboss.logging.Logger.getLogger(TenantGuards.class)
          .errorf("Outlet authorization failed: outletId=%s, outletTenant=%s, requestTenant=%s, userSub=%s", 
              outletId, outletTenant, tenantId, sub);
              
      throw new ForbiddenException("Outlet not in tenant");
    }

    return outlet;
  }

  public String claim(final String name) {
    // 1. Try JsonWebToken if available
    if (jwt != null) {
      try {
        final Object v = jwt.getClaim(name);
        if (v != null) return v.toString();
      } catch (final Exception ignored) {}
    }

    // 2. Special case for 'sub' / 'subject' -> use principal name
    if ("sub".equals(name) || "subject".equals(name)) {
      if (identity != null && identity.getPrincipal() != null) {
        return identity.getPrincipal().getName();
      }
    }

    // 3. Fallback to SecurityIdentity attributes
    if (identity != null) {
      final Object v = identity.getAttributes().get(name);
      if (v != null) return v.toString();
    }

    return null;
  }
}
