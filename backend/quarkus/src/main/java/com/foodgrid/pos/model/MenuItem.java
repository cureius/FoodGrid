package com.foodgrid.pos.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "menu_items")
public class MenuItem extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "outlet_id", nullable = false, length = 36)
  public String outletId;

  @Column(name = "tenant_id", length = 36)
  public String tenantId;

  @Column(name = "category_id", length = 36)
  public String categoryId;

  @Column(nullable = false, length = 160)
  public String name;

  @Column(length = 500)
  public String description;

  @Column(name = "is_veg", nullable = false)
  public boolean isVeg;

  @Column(name = "base_price", nullable = false, precision = 12, scale = 2)
  public BigDecimal basePrice;

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
