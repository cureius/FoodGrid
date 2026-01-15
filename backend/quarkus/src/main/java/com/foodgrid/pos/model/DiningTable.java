package com.foodgrid.pos.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "dining_tables")
public class DiningTable extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "outlet_id", nullable = false, length = 36)
  public String outletId;

  @Column(name = "table_code", nullable = false, length = 64)
  public String tableCode;

  @Column(name = "display_name", nullable = false, length = 120)
  public String displayName;

  @Column(nullable = false)
  public int capacity;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  public Status status;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "created_at")
  public Date createdAt;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "updated_at")
  public Date updatedAt;

  public enum Status {
    ACTIVE,
    INACTIVE
  }
}
