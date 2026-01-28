package com.foodgrid.auth.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "customers")
public class Customer extends PanacheEntityBase {

    @Id
    @Column(length = 36)
    public String id;

    @Column(unique = true, nullable = true, length = 15)
    public String mobileNumber;

    @Column(unique = true, nullable = true, length = 255)
    public String email;

    @Column(length = 100)
    public String displayName;

    @Column(length = 255)
    public String avatarUrl;

    @Column(nullable = false)
    public String status = "ACTIVE";

    @Column(nullable = false, updatable = false)
    public Instant createdAt;

    public Instant lastLoginAt;

    @Column(length = 20)
    public String provider = "LOCAL";

    @Column(length = 255)
    public String providerUserId;

    public Customer() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
    }

    public static Customer findByMobile(String mobileNumber) {
        return find("mobileNumber", mobileNumber).firstResult();
    }

    public static Customer findByEmail(String email) {
        return find("email", email).firstResult();
    }
}
