package com.foodgrid.payment.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "gateway_refunds")
public class GatewayRefund extends PanacheEntityBase {

    @Id
    @Column(length = 36)
    public String id;

    @Column(name = "transaction_id", nullable = false, length = 36)
    public String transactionId;

    @Column(name = "gateway_refund_id", length = 255)
    public String gatewayRefundId;

    @Column(nullable = false, precision = 12, scale = 2)
    public BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    public RefundStatus status;

    @Column(columnDefinition = "TEXT")
    public String reason;

    @Column(name = "gateway_response", columnDefinition = "TEXT")
    public String gatewayResponse;

  @Column(name = "created_at")
  public Instant createdAt;

  @Column(name = "processed_at")
  public Instant processedAt;

    public static java.util.List<GatewayRefund> findByTransactionId(final String transactionId) {
        return list("transactionId", transactionId);
    }
}
