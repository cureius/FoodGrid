package com.foodgrid.auth.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "pin_otp_challenges")
public class PinOtpChallenge extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "employee_id", nullable = false, length = 36)
  public String employeeId;

  @Column(name = "outlet_id", nullable = false, length = 36)
  public String outletId;

  @Column(name = "otp_hash", nullable = false, length = 255)
  public String otpHash;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "expires_at", nullable = false)
  public Date expiresAt;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "consumed_at")
  public Date consumedAt;

  @Column(name = "resend_count", nullable = false)
  public int resendCount;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "created_at", nullable = false)
  public Date createdAt;
}
