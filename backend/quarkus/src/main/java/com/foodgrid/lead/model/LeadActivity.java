package com.foodgrid.lead.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

@Entity
@Table(name = "lead_activities")
public class LeadActivity extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false)
    @JsonIgnore
    public Lead lead;

    @Column(length = 50, nullable = false)
    public String channel; // CALL, EMAIL, WHATSAPP, VISIT, DEMO, PITCH

    @Column(columnDefinition = "TEXT")
    public String outcome;

    @Column(name = "performed_by", length = 100)
    public String performedBy;

    @Column(name = "template_reference", length = 100)
    public String templateReference;

    @Column(name = "performed_at")
    public java.util.Date performedAt = new java.util.Date();

    @Lob
    @Column(name = "metadata", columnDefinition = "TEXT")
    public String metadata; // For recording link opens, engagement etc.
}
