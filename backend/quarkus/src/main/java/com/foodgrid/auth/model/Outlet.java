package com.foodgrid.auth.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

@Entity
@Table(name = "outlets")
public class Outlet extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "owner_id", nullable = false, length = 36)
  public String ownerId;

  @Column(name = "client_id", length = 36)
  public String clientId;

  @Column(nullable = false, length = 120)
  public String name;

  @Column(nullable = false, length = 64)
  public String timezone;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  public Status status;

  public enum Status {
    ACTIVE,
    INACTIVE
  }
}
