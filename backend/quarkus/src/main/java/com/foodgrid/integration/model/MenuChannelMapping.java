package com.foodgrid.integration.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "menu_channel_mappings")
public class MenuChannelMapping extends PanacheEntityBase {
    @Id
    @Column(length = 36)
    public String id;

    @Column(name = "outlet_id", nullable = false, length = 36)
    public String outletId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public SourceChannel channel;

    @Column(name = "foodgrid_entity_id", nullable = false, length = 36)
    public String foodgridEntityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "foodgrid_entity_type", nullable = false)
    public EntityType foodgridEntityType;

    @Column(name = "external_entity_id", nullable = false, length = 100)
    public String externalEntityId;

    @Column(name = "last_sync_at")
    public Instant lastSyncAt;

    public enum EntityType {
        CATEGORY,
        ITEM,
        VARIANT,
        ADDON
    }
}
