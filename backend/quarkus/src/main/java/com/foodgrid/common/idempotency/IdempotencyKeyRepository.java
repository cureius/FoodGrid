package com.foodgrid.common.idempotency;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

@ApplicationScoped
public class IdempotencyKeyRepository implements PanacheRepositoryBase<IdempotencyKey, String> {

  public Optional<IdempotencyKey> findByScope(final String tenantId, final String operation, final String key) {
    return find("tenantId = ?1 and operation = ?2 and key = ?3", tenantId, operation, key)
      .firstResultOptional();
  }

  public Optional<IdempotencyKey> findAny(final String operation, final String key) {
    return find("operation = ?1 and key = ?2", operation, key)
      .firstResultOptional();
  }
}
