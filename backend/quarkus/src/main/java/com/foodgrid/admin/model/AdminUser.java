package com.foodgrid.admin.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

@Entity
@Table(name = "admin_users")
public class AdminUser extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(nullable = false, length = 190, unique = true)
  public String email;

  @Column(name = "password_hash", nullable = false, length = 255)
  public String passwordHash;

  @Column(name = "display_name", nullable = false, length = 120)
  public String displayName;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  public Status status;

  public enum Status {
    ACTIVE,
    INACTIVE
  }
}
