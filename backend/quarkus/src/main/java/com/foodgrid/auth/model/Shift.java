package com.foodgrid.auth.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "shifts")
public class Shift extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "outlet_id", nullable = false, length = 36)
  public String outletId;

  @Column(name = "employee_id", nullable = false, length = 36)
  public String employeeId;

  @Column(name = "device_id", nullable = false, length = 36)
  public String deviceId;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "started_at", nullable = false)
  public Date startedAt;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "ended_at")
  public Date endedAt;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  public ShiftStatus status;

  public enum ShiftStatus {
    ACTIVE,
    CLOSED
  }
}
