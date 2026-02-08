package com.foodgrid.lead.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

@Entity
@Table(name = "lead_raw_place_data")
public class RawPlaceData extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "external_place_id", nullable = false, length = 255)
    public String externalPlaceId;

    @Column(name = "source", nullable = false, length = 50)
    public String source = "GOOGLE_PLACES";

    @Lob
    @Column(name = "raw_json", columnDefinition = "LONGTEXT")
    public String rawJson;

    @Column(name = "discovered_at")
    public java.util.Date discoveredAt = new java.util.Date();

    @Column(name = "is_processed")
    public boolean isProcessed = false;
}
