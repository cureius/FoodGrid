package com.foodgrid.pos.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "menu_item_recipes")
public class MenuItemRecipe extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "menu_item_id", nullable = false, length = 36)
  public String menuItemId;

  @Column(name = "ingredient_id", nullable = false, length = 36)
  public String ingredientId;

  @Column(nullable = false, precision = 15, scale = 4)
  public BigDecimal quantity;

  @Column(name = "unit_id", nullable = false, length = 36)
  public String unitId;

  @Column(length = 500)
  public String notes;

  @Column(name = "is_optional", nullable = false)
  public Boolean isOptional = false;

  @Column(name = "sort_order", nullable = false)
  public Integer sortOrder = 0;

  @Column(name = "created_at", nullable = false, updatable = false)
  public LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  public LocalDateTime updatedAt;

  @PrePersist
  public void prePersist() {
    if (id == null || id.isEmpty()) {
      id = UUID.randomUUID().toString();
    }
    LocalDateTime now = LocalDateTime.now();
    if (createdAt == null) createdAt = now;
    if (updatedAt == null) updatedAt = now;
    if (isOptional == null) isOptional = false;
    if (sortOrder == null) sortOrder = 0;
  }

  @PreUpdate
  public void preUpdate() {
    updatedAt = LocalDateTime.now();
  }
}
