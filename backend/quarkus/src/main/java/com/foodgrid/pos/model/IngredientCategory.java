package com.foodgrid.pos.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ingredient_categories")
public class IngredientCategory extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "outlet_id", nullable = false, length = 36)
  public String outletId;

  @Column(nullable = false, length = 120)
  public String name;

  @Column(length = 500)
  public String description;

  @Column(length = 50)
  public String icon;

  @Column(name = "sort_order", nullable = false)
  public Integer sortOrder = 0;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  public Status status = Status.ACTIVE;

  @Column(name = "created_at", nullable = false, updatable = false)
  public LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  public LocalDateTime updatedAt;

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
