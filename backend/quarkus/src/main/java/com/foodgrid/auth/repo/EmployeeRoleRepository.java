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
}
