package com.foodgrid.integration.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "channel_integrations")
public class ChannelIntegration extends PanacheEntityBase {
    @Id
    @Column(length = 36)
    public String id;

    @Column(name = "outlet_id", nullable = false, length = 36)
    public String outletId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public SourceChannel channel;

    @Column(name = "external_store_id", length = 100)
    public String externalStoreId;

    @Column(name = "auth_payload", columnDefinition = "TEXT")
    public String authPayload; // JSON string for tokens/credentials

    @Column(name = "is_active", nullable = false)
    public boolean isActive = true;

    @Column(name = "last_sync_at")
    public Instant lastSyncAt;

    @Column(name = "created_at")
    public Instant createdAt;

    @Column(name = "updated_at")
    public Instant updatedAt;
}
