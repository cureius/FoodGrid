package com.foodgrid.pos.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "order_items")
public class OrderItem extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "order_id", nullable = false, length = 36)
  public String orderId;

  @Column(name = "item_id", nullable = false, length = 36)
  public String itemId;

  @Column(name = "item_name", nullable = false, length = 160)
  public String itemName;

  @Column(nullable = false, precision = 10, scale = 2)
  public BigDecimal qty;

  @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
  public BigDecimal unitPrice;

  @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
  public BigDecimal lineTotal;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  public Status status;

  @Column(name = "created_at")
  public Instant createdAt;

  public enum Status {
    OPEN,
    SERVED,
    CANCELLED
  }
}
