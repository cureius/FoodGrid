package com.foodgrid.auth.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "shift_sessions")
public class ShiftSession extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "shift_id", nullable = false, length = 36)
  public String shiftId;

  @Column(name = "device_id", nullable = false, length = 36)
  public String deviceId;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "created_at", nullable = false)
  public Date createdAt;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "revoked_at")
  public Date revokedAt;
}
