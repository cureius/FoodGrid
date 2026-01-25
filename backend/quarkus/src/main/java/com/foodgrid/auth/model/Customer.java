package com.foodgrid.auth.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "customers")
public class Customer extends PanacheEntityBase {

    @Id
    @Column(length = 36)
    public String id;

    @Column(unique = true, nullable = false, length = 15)
    public String mobileNumber;

    @Column(length = 100)
    public String displayName;

    @Column(length = 255)
    public String email;

    @Column(length = 255)
    public String avatarUrl;

    @Column(nullable = false)
    public String status = "ACTIVE";

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false, updatable = false)
    public Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    public Date lastLoginAt;

    public Customer() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = new Date();
    }

    public static Customer findByMobile(String mobileNumber) {
        return find("mobileNumber", mobileNumber).firstResult();
    }
}
