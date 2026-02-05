package com.foodgrid.lead.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

@Entity
@Table(name = "lead_contacts")
public class LeadContact extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false)
    @JsonIgnore
    public Lead lead;

    @Column(length = 255)
    public String name;

    @Column(length = 100)
    public String role;

    @Column(length = 190)
    public String email;

    @Column(length = 50)
    public String phone;

    @Column(length = 255)
    public String source;

    @Column(name = "is_spoc")
    public boolean isSpoc = false;

    @Column(name = "created_at")
    public java.util.Date createdAt = new java.util.Date();
}
