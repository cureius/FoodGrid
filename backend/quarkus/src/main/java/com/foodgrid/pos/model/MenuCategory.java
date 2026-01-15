package com.foodgrid.pos.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "menu_categories")
public class MenuCategory extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "outlet_id", nullable = false, length = 36)
  public String outletId;

  @Column(nullable = false, length = 120)
  public String name;

  @Column(name = "sort_order", nullable = false)
  public int sortOrder;

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
