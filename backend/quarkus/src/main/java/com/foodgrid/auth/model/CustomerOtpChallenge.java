package com.foodgrid.auth.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "customer_otp_challenges")
public class CustomerOtpChallenge extends PanacheEntityBase {
    @Id
    @Column(length = 36)
    public String id;

    @Column(length = 15)
    public String mobileNumber;

    @Column(length = 255)
    public String email;

    @Column(nullable = false)
    public String challengeType; // "MOBILE" or "EMAIL"

    @Column(nullable = false, length = 255)
    public String otpHash;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    public Date expiresAt;

    @Temporal(TemporalType.TIMESTAMP)
    public Date consumedAt;

    public int resendCount = 0;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    public Date createdAt;

    public CustomerOtpChallenge() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = new Date();
    }

    public static CustomerOtpChallenge findLatest(String mobileNumber) {
        return find("mobileNumber = ?1 and consumedAt is null order by createdAt desc", mobileNumber).firstResult();
    }

    public static CustomerOtpChallenge findLatestByEmail(String email) {
        return find("email = ?1 and consumedAt is null order by createdAt desc", email).firstResult();
    }

    public static CustomerOtpChallenge findLatestByMobile(String mobileNumber) {
        return find("mobileNumber = ?1 and challengeType = 'MOBILE' and consumedAt is null order by createdAt desc", mobileNumber).firstResult();
    }
}
