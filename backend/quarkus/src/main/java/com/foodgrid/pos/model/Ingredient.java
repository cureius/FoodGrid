package com.foodgrid.pos.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ingredients")
public class Ingredient extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "outlet_id", nullable = false, length = 36)
  public String outletId;

  @Column(name = "category_id", length = 36)
  public String categoryId;

  @Column(length = 50)
  public String sku;

  @Column(nullable = false, length = 200)
  public String name;

  @Column(columnDefinition = "TEXT")
  public String description;

  @Column(name = "image_url", length = 500)
  public String imageUrl;

  @Column(name = "unit_id", nullable = false, length = 36)
  public String unitId;

  @Column(name = "cost_price", nullable = false, precision = 12, scale = 2)
  public BigDecimal costPrice = BigDecimal.ZERO;

  @Column(name = "is_sellable", nullable = false)
  public Boolean isSellable = false;

  @Column(name = "selling_price", precision = 12, scale = 2)
  public BigDecimal sellingPrice;

  @Column(name = "linked_menu_item_id", length = 36)
  public String linkedMenuItemId;

  @Column(name = "track_inventory", nullable = false)
  public Boolean trackInventory = true;

  @Column(name = "current_stock", nullable = false, precision = 15, scale = 4)
  public BigDecimal currentStock = BigDecimal.ZERO;

  @Column(name = "reorder_level", precision = 15, scale = 4)
  public BigDecimal reorderLevel;

  @Column(name = "reorder_quantity", precision = 15, scale = 4)
  public BigDecimal reorderQuantity;

  @Column(name = "max_stock_level", precision = 15, scale = 4)
  public BigDecimal maxStockLevel;

  @Column(name = "shelf_life_days")
  public Integer shelfLifeDays;

  @Column(name = "storage_instructions", columnDefinition = "TEXT")
  public String storageInstructions;

  @Column(name = "default_supplier_id", length = 36)
  public String defaultSupplierId;

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
