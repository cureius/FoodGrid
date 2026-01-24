package com.foodgrid.payment.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "gateway_transactions")
public class GatewayTransaction extends PanacheEntityBase {

    @Id
    @Column(length = 36)
    public String id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    public String tenantId;

    @Column(name = "client_id", nullable = false, length = 36)
    public String clientId;

    @Column(name = "outlet_id", nullable = false, length = 36)
    public String outletId;

    @Column(name = "order_id", nullable = false, length = 36)
    public String orderId;

    @Column(name = "payment_id", length = 36)
    public String paymentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "gateway_type", nullable = false, length = 50)
    public PaymentGatewayType gatewayType;

    @Column(name = "gateway_order_id", length = 255)
    public String gatewayOrderId;

    @Column(name = "gateway_payment_id", length = 255)
    public String gatewayPaymentId;

    @Column(name = "gateway_signature", length = 512)
    public String gatewaySignature;

    @Column(nullable = false, precision = 12, scale = 2)
    public BigDecimal amount;

    @Column(length = 3)
    public String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    public GatewayTransactionStatus status;

    @Column(name = "payment_method", length = 100)
    public String paymentMethod;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    public String failureReason;

    @Column(name = "gateway_response", columnDefinition = "TEXT")
    public String gatewayResponse;

    @Column(name = "idempotency_key", length = 255)
    public String idempotencyKey;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at")
    public Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    public Date updatedAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "completed_at")
    public Date completedAt;

    public static GatewayTransaction findByGatewayOrderId(final String gatewayOrderId) {
        return find("gatewayOrderId", gatewayOrderId).firstResult();
    }

    public static GatewayTransaction findByGatewayPaymentId(final String gatewayPaymentId) {
        return find("gatewayPaymentId", gatewayPaymentId).firstResult();
    }

    public static GatewayTransaction findByOrderId(final String orderId) {
        return find("orderId = ?1 order by createdAt desc", orderId).firstResult();
    }

    public static List<GatewayTransaction> findByTenantId(final String tenantId) {
        return list("tenantId = ?1 order by createdAt desc", tenantId);
    }

    public static GatewayTransaction findByIdempotencyKey(final String idempotencyKey) {
        return find("idempotencyKey", idempotencyKey).firstResult();
    }
}
