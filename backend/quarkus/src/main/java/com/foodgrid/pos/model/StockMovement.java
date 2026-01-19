package com.foodgrid.pos.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_movements")
public class StockMovement extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "outlet_id", nullable = false, length = 36)
  public String outletId;

  @Column(name = "ingredient_id", nullable = false, length = 36)
  public String ingredientId;

  @Enumerated(EnumType.STRING)
  @Column(name = "movement_type", nullable = false)
  public MovementType movementType;

  @Column(nullable = false, precision = 15, scale = 4)
  public BigDecimal quantity;

  @Column(name = "unit_id", nullable = false, length = 36)
  public String unitId;

  @Column(name = "unit_cost", precision = 12, scale = 2)
  public BigDecimal unitCost;

  @Column(name = "total_cost", precision = 12, scale = 2)
  public BigDecimal totalCost;

  @Column(name = "reference_type", length = 50)
  public String referenceType;

  @Column(name = "reference_id", length = 36)
  public String referenceId;

  @Column(name = "supplier_id", length = 36)
  public String supplierId;

  @Column(name = "purchase_order_number", length = 50)
  public String purchaseOrderNumber;

  @Column(name = "invoice_number", length = 50)
  public String invoiceNumber;

  @Column(name = "wastage_reason", length = 500)
  public String wastageReason;

  @Column(name = "stock_before", nullable = false, precision = 15, scale = 4)
  public BigDecimal stockBefore;

  @Column(name = "stock_after", nullable = false, precision = 15, scale = 4)
  public BigDecimal stockAfter;

  @Column(columnDefinition = "TEXT")
  public String notes;

  @Column(name = "recorded_by_employee_id", length = 36)
  public String recordedByEmployeeId;

  @Column(name = "recorded_at", nullable = false)
  public LocalDateTime recordedAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  public LocalDateTime createdAt;

  public enum MovementType {
    PURCHASE, USAGE, WASTAGE, ADJUSTMENT, TRANSFER_IN, TRANSFER_OUT, RETURN, OPENING_STOCK
  }

  @PrePersist
  public void prePersist() {
    if (createdAt == null) createdAt = LocalDateTime.now();
    if (recordedAt == null) recordedAt = LocalDateTime.now();
  }
}
