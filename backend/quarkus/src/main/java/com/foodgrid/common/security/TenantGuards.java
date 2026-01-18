package com.foodgrid.common.security;

import com.foodgrid.auth.model.Outlet;
import com.foodgrid.auth.repo.OutletRepository;
import com.foodgrid.common.multitenancy.TenantContext;
import io.quarkus.security.identity.SecurityIdentity;
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
      throw new ForbiddenException("Outlet not in tenant");
    }

    return outlet;
  }

  /**
   * Reads a JWT claim from SecurityIdentity attributes.
   */
  public String claim(final String name) {
    final Object v = identity.getAttributes().get(name);
    return v == null ? null : v.toString();
  }
}
