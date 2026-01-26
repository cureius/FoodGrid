package com.foodgrid.pos.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "orders")
public class Order extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "outlet_id", nullable = false, length = 36)
  public String outletId;

  @Column(name = "tenant_id", length = 36)
  public String tenantId;

  @Column(name = "device_id", nullable = true, length = 36)
  public String deviceId;

  @Column(name = "shift_id", nullable = true, length = 36)
  public String shiftId;

  @Column(name = "employee_id", nullable = true, length = 36)
  public String employeeId;

  @Column(name = "customer_id", nullable = true, length = 36)
  public String customerId;

  @Column(name = "table_id", length = 36)
  public String tableId;

  @Enumerated(EnumType.STRING)
  @Column(name = "order_type", nullable = false)
  public OrderType orderType;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  public Status status;

  @Column(nullable = false, precision = 12, scale = 2)
  public BigDecimal subtotal;

  @Column(name = "tax_total", nullable = false, precision = 12, scale = 2)
  public BigDecimal taxTotal;

  @Column(name = "discount_total", nullable = false, precision = 12, scale = 2)
  public BigDecimal discountTotal;

  @Column(name = "grand_total", nullable = false, precision = 12, scale = 2)
  public BigDecimal grandTotal;

  @Column(length = 500)
  public String notes;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "created_at")
  public Date createdAt;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "updated_at")
  public Date updatedAt;

  public enum OrderType {
    DINE_IN,
    TAKEAWAY,
    DELIVERY
  }

  public enum Status {
    OPEN,
    KOT_SENT,
    SERVED,
    BILLED,
    PAID,
    CANCELLED
  }
}
