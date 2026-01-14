package com.foodgrid.auth.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "outlets")
public class Outlet extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(nullable = false, length = 120)
  public String name;

  @Column(nullable = false, length = 64)
  public String timezone;
}
