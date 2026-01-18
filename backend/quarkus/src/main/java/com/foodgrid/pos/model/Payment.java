package com.foodgrid.pos.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "payments")
public class Payment extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "order_id", nullable = false, length = 36)
  public String orderId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  public Method method;

  @Column(nullable = false, precision = 12, scale = 2)
  public BigDecimal amount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  public Status status;

  /** Reference to gateway_transactions.id for GATEWAY payments */
  @Column(name = "gateway_transaction_id", length = 36)
  public String gatewayTransactionId;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "created_at")
  public Date createdAt;

  public enum Method {
    CASH,
    CARD,
    UPI,
    GATEWAY // Online payment via payment gateway
  }

  public enum Status {
    CAPTURED,
    VOID,
    PENDING // For gateway payments awaiting confirmation
  }
}
