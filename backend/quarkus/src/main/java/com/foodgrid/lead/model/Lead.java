package com.foodgrid.lead.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "leads")
public class Lead extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "external_place_id", unique = true, length = 255)
    public String externalPlaceId;

    @Column(nullable = false, length = 255)
    public String name;

    @Column(length = 100)
    public String category;

    @Column(length = 100)
    public String city;

    @Column(length = 100)
    public String area;

    @Column(columnDefinition = "TEXT")
    public String address;

    public Double latitude;
    public Double longitude;

    @Column(length = 50)
    public String phone;

    @Column(length = 255)
    public String website;

    public Double rating;

    @Column(name = "review_count")
    public Integer reviewCount;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    public LeadStatus status = LeadStatus.DISCOVERED;

    @Column(name = "lead_score")
    public Double score = 0.0;

    @Column(name = "created_at")
    public java.util.Date createdAt = new java.util.Date();

    @Column(name = "updated_at")
    public java.util.Date updatedAt = new java.util.Date();

    @OneToMany(mappedBy = "lead", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    public List<LeadContact> contacts;

    @OneToMany(mappedBy = "lead", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    public List<LeadActivity> activities;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = new Date();
    }
}
