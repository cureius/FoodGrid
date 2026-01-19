package com.foodgrid.pos.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "units_of_measure")
public class UnitOfMeasure extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "outlet_id", nullable = false, length = 36)
  public String outletId;

  @Column(nullable = false, length = 50)
  public String name;

  @Column(nullable = false, length = 10)
  public String abbreviation;

  @Enumerated(EnumType.STRING)
  @Column(name = "unit_type", nullable = false)
  public UnitType unitType;

  @Column(name = "base_unit_id", length = 36)
  public String baseUnitId;

  @Column(name = "conversion_factor", precision = 15, scale = 6)
  public java.math.BigDecimal conversionFactor;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  public Status status = Status.ACTIVE;

  @Column(name = "created_at", nullable = false, updatable = false)
  public LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  public LocalDateTime updatedAt;

  public enum UnitType {
    WEIGHT, VOLUME, COUNT, LENGTH
  }

  public enum Status {
    ACTIVE, INACTIVE
  }

  @PrePersist
  public void prePersist() {
    if (createdAt == null) createdAt = LocalDateTime.now();
    if (updatedAt == null) updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  public void preUpdate() {
    updatedAt = LocalDateTime.now();
  }
}
