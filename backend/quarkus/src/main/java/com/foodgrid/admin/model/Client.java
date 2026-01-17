package com.foodgrid.admin.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "clients")
public class Client extends PanacheEntityBase {

  @Id
  @Column(length = 36)
  public String id;

  @Column(nullable = false, length = 190)
  public String name;

  @Column(name = "contact_email", length = 190)
  public String contactEmail;

  @Enumerated(EnumType.STRING)
  @Column(length = 32)
  public Status status = Status.ACTIVE;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "created_at")
  public Date createdAt;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "updated_at")
  public Date updatedAt;

  public enum Status {
    ACTIVE,
    INACTIVE
  }
}
