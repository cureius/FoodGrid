package com.foodgrid.pos.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "menu_item_images")
public class MenuItemImage extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "menu_item_id", nullable = false, length = 36)
  public String menuItemId;

  @Column(name = "image_url", nullable = false, length = 500)
  public String imageUrl;

  @Column(name = "sort_order", nullable = false)
  public int sortOrder = 0;

  @Column(name = "is_primary", nullable = false)
  public boolean isPrimary = false;

  @Column(name = "created_at", nullable = false, updatable = false)
  public LocalDateTime createdAt;

  @PrePersist
  public void prePersist() {
    if (createdAt == null) createdAt = LocalDateTime.now();
  }
}
