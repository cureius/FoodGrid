package com.foodgrid.pos.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "suppliers")
public class Supplier extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "outlet_id", nullable = false, length = 36)
  public String outletId;

  @Column(nullable = false, length = 200)
  public String name;

  @Column(name = "contact_person", length = 120)
  public String contactPerson;

  @Column(length = 190)
  public String email;

  @Column(length = 30)
  public String phone;

  @Column(columnDefinition = "TEXT")
  public String address;

  @Column(columnDefinition = "TEXT")
  public String notes;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  public Status status = Status.ACTIVE;

  @Column(name = "created_at", nullable = false, updatable = false)
  public LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  public LocalDateTime updatedAt;

  public enum Status {
    ACTIVE, INACTIVE
  }

  @PrePersist
  public void prePersist() {
    if (createdAt == null) createdAt = LocalDateTime.now();
    if (updatedAt == null) updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  public void preUpdate() {
    updatedAt = LocalDateTime.now();
  }
}
