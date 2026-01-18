package com.foodgrid.common.audit;

import com.foodgrid.common.multitenancy.TenantContext;
import com.foodgrid.common.util.Ids;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.Date;

@ApplicationScoped
public class AuditLogService {

  @Inject AuditLogRepository repo;
  @Inject TenantContext tenantContext;
  @Inject SecurityIdentity identity;

  @Transactional
  public void record(final String action, final String outletId, final String entityType, final String entityId, final String meta) {
    final AuditLog a = new AuditLog();
    a.id = Ids.uuid();
    a.tenantId = tenantContext.hasTenant() ? tenantContext.getTenantId() : null;
    a.outletId = outletId;

    final String actorType = attribute("principalType");
    a.actorType = (actorType == null || actorType.isBlank()) ? "UNKNOWN" : actorType;
    a.actorId = (identity.getPrincipal() == null) ? null : identity.getPrincipal().getName();

    a.action = action;
    a.entityType = entityType;
    a.entityId = entityId;
    a.meta = meta;
    a.createdAt = Date.from(Instant.now());

    repo.persist(a);
  }

  private String attribute(final String name) {
    final Object v = identity.getAttributes().get(name);
    return v == null ? null : v.toString();
  }
}
