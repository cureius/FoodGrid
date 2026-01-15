package com.foodgrid.auth.repo;

import io.quarkus.hibernate.orm.panache.Panache;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class EmployeeRoleRepository {
  @SuppressWarnings("unchecked")
  public List<String> listRoles(String employeeId) {
    return Panache.getEntityManager()
      .createNativeQuery("select role from employee_roles where employee_id = ?1")
      .setParameter(1, employeeId)
      .getResultList();
  }

  public void addRole(String employeeId, String role) {
    Panache.getEntityManager()
      .createNativeQuery("insert ignore into employee_roles (employee_id, role) values (?1, ?2)")
      .setParameter(1, employeeId)
      .setParameter(2, role)
      .executeUpdate();
  }

  public void removeRole(String employeeId, String role) {
    Panache.getEntityManager()
      .createNativeQuery("delete from employee_roles where employee_id = ?1 and role = ?2")
      .setParameter(1, employeeId)
      .setParameter(2, role)
      .executeUpdate();
  }

  public void replaceRoles(String employeeId, List<String> roles) {
    Panache.getEntityManager()
      .createNativeQuery("delete from employee_roles where employee_id = ?1")
      .setParameter(1, employeeId)
      .executeUpdate();

    if (roles == null) return;
    for (String r : roles) {
      if (r == null || r.isBlank()) continue;
      addRole(employeeId, r);
    }
  }
}
