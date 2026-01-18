package com.foodgrid.common.idempotency;

import com.foodgrid.common.util.Ids;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;

import java.time.Instant;
import java.util.Date;
import java.util.Optional;

@ApplicationScoped
public class IdempotencyService {

  @Inject IdempotencyKeyRepository repository;

  public record Result(String resultRef) {}

  /**
   * Checks/reserves an idempotency key.
   *
   * @return Optional<Result> if it was already completed, empty if caller should proceed.
   */
  @Transactional
  public Optional<Result> checkOrReserve(final String tenantId, final String operation, final String key, final String requestHash) {
    if (key == null || key.isBlank()) {
      return Optional.empty();
    }

    // 1) Prefer strict tenant-scoped lookup
    final IdempotencyKey existing = repository.findByScope(tenantId, operation, key).orElse(null);

    // 2) If not found, check for accidental cross-tenant reuse / tenant-resolution mismatch.
    if (existing == null) {
      final IdempotencyKey any = repository.findAny(operation, key).orElse(null);
      if (any != null && any.tenantId != null && !any.tenantId.equals(tenantId)) {
        throw conflict("Idempotency key belongs to another tenant");
      }

      final IdempotencyKey idem = new IdempotencyKey();
      idem.id = Ids.uuid();
      idem.tenantId = tenantId;
      idem.operation = operation;
      idem.key = key;
      idem.requestHash = requestHash;
      idem.resultRef = null;
      idem.createdAt = Date.from(Instant.now());
      repository.persist(idem);
      return Optional.empty();
    }

    // Same key but different payload => conflict
    if (!existing.requestHash.equals(requestHash)) {
      throw conflict("Idempotency key reuse with different request");
    }

    // If we already have a resultRef, return it so the caller can replay.
    if (existing.resultRef != null && !existing.resultRef.isBlank()) {
      return Optional.of(new Result(existing.resultRef));
    }

    // Reserved but no result yet: treat as conflict to avoid double-processing.
    throw conflict("Idempotency key is in progress");
  }

  @Transactional
  public void markCompleted(final String tenantId, final String operation, final String key, final String requestHash, final String resultRef) {
    if (key == null || key.isBlank()) {
      return;
    }

    final IdempotencyKey idem = repository.findByScope(tenantId, operation, key)
      .orElseThrow(() -> conflict("Idempotency key missing"));

    if (!idem.requestHash.equals(requestHash)) {
      throw conflict("Idempotency key mismatch");
    }

    idem.resultRef = resultRef;
    repository.persist(idem);
  }

  private static WebApplicationException conflict(final String message) {
    return new WebApplicationException(message, Response.Status.CONFLICT);
  }
}
