package com.foodgrid.payment.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.List;

/**
 * Stores webhook events received from payment gateways for audit and replay.
 */
@Entity
@Table(name = "gateway_webhook_events")
public class GatewayWebhookEvent extends PanacheEntityBase {

    @Id
    @Column(length = 36)
    public String id;

    @Enumerated(EnumType.STRING)
    @Column(name = "gateway_type", nullable = false, length = 50)
    public PaymentGatewayType gatewayType;

    @Column(name = "event_type", length = 100)
    public String eventType;

    @Column(name = "gateway_event_id", length = 255)
    public String gatewayEventId;

    @Column(columnDefinition = "TEXT")
    public String payload;

    @Column(length = 512)
    public String signature;

    @Column(name = "is_verified")
    public boolean isVerified = false;

    @Column(name = "is_processed")
    public boolean isProcessed = false;

    @Column(name = "processing_error", columnDefinition = "TEXT")
    public String processingError;

    @Column(name = "created_at")
    public Instant createdAt;

    @Column(name = "processed_at")
    public Instant processedAt;

    public static GatewayWebhookEvent findByGatewayEventId(final String gatewayEventId) {
        return find("gatewayEventId", gatewayEventId).firstResult();
    }

    public static List<GatewayWebhookEvent> findUnprocessed() {
        return list("isVerified = true and isProcessed = false order by createdAt asc");
    }
}
