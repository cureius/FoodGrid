package com.foodgrid.auth.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

/**
 * Entity mapping for employee_roles.
 *
 * This table is used from native SQL in EmployeeRoleRepository, so we map it to ensure
 * Hibernate creates it when database.generation=update is enabled.
 */
@Entity
@Table(name = "employee_roles")
@IdClass(EmployeeRoleId.class)
public class EmployeeRole extends PanacheEntityBase {

  @Id
  @Column(name = "employee_id", length = 36, nullable = false)
  public String employeeId;

  @Id
  @Column(name = "role", length = 20, nullable = false)
  public String role;
}
