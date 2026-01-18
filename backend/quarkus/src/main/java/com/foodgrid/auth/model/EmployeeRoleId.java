package com.foodgrid.auth.model;

import java.io.Serializable;
import java.util.Objects;

/** Composite key for employee_roles. */
public class EmployeeRoleId implements Serializable {
  public String employeeId;
  public String role;

  public EmployeeRoleId() {}

  public EmployeeRoleId(final String employeeId, final String role) {
    this.employeeId = employeeId;
    this.role = role;
  }

  @Override
  public boolean equals(final Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    final EmployeeRoleId that = (EmployeeRoleId) o;
    return Objects.equals(employeeId, that.employeeId) && Objects.equals(role, that.role);
  }

  @Override
  public int hashCode() {
    return Objects.hash(employeeId, role);
  }
}
