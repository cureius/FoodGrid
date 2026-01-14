package com.foodgrid.auth.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "employee_credentials")
public class EmployeeCredential extends PanacheEntityBase {
  @Id
  @Column(name = "employee_id", length = 36)
  public String employeeId;

  @Column(name = "pin_hash", nullable = false, length = 255)
  public String pinHash;

  @Column(name = "failed_pin_attempts", nullable = false)
  public int failedPinAttempts;

  @Column(name = "locked_until")
  @Temporal(TemporalType.TIMESTAMP)
  public Date lockedUntil;

  @Column(name = "pin_updated_at")
  @Temporal(TemporalType.TIMESTAMP)
  public Date pinUpdatedAt;
}
