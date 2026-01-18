package com.foodgrid.common.idempotency;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.util.Date;

/**
 * Stores idempotency keys for write operations (payments, refunds, order submission, etc.).
 *
 * Key is scoped by tenant + actor + operation to avoid collisions.
 */
@Entity
@Table(name = "idempotency_keys",
  uniqueConstraints = {
    @UniqueConstraint(name = "uk_idem_scope_key", columnNames = {"tenant_id", "operation", "idem_key"})
  }
)
public class IdempotencyKey extends PanacheEntityBase {

  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "tenant_id", nullable = false, length = 36)
  public String tenantId;

  @Column(name = "operation", nullable = false, length = 80)
  public String operation;

  @Column(name = "idem_key", nullable = false, length = 190)
  public String key;

  /**
   * A stable hash of the request payload to detect mismatched replays.
   */
  @Column(name = "request_hash", nullable = false, length = 64)
  public String requestHash;

  /**
   * Response payload reference (e.g., paymentId). Keep it small.
   */
  @Column(name = "result_ref", length = 64)
  public String resultRef;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "created_at")
  public Date createdAt;
}
