package com.foodgrid.common.audit;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "audit_log")
public class AuditLog extends PanacheEntityBase {

  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "tenant_id", length = 36)
  public String tenantId;

  @Column(name = "outlet_id", length = 36)
  public String outletId;

  @Column(name = "actor_type", nullable = false, length = 20)
  public String actorType; // ADMIN / EMPLOYEE / SYSTEM

  @Column(name = "actor_id", length = 36)
  public String actorId;

  @Column(name = "action", nullable = false, length = 80)
  public String action;

  @Column(name = "entity_type", length = 40)
  public String entityType;

  @Column(name = "entity_id", length = 64)
  public String entityId;

  @Column(name = "meta", length = 1000)
  public String meta;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "created_at")
  public Date createdAt;
}
