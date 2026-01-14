package com.foodgrid.auth.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

@Entity
@Table(name = "employees")
public class Employee extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "outlet_id", nullable = false, length = 36)
  public String outletId;

  @Column(name = "display_name", nullable = false, length = 120)
  public String displayName;

  @Column(nullable = false, length = 190, unique = true)
  public String email;

  @Column(name = "avatar_url", length = 500)
  public String avatarUrl;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  public EmployeeStatus status;

  public enum EmployeeStatus {
    ACTIVE,
    INACTIVE
  }
}
