package com.foodgrid.auth.repo;

import com.foodgrid.auth.model.Employee;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class EmployeeRepository implements PanacheRepositoryBase<Employee, String> {
  public List<Employee> listByOutlet(String outletId) {
    return list("outletId = ?1 and status = ?2 order by displayName asc", outletId, Employee.EmployeeStatus.ACTIVE);
  }

  public Optional<Employee> findByEmailAndOutlet(String email, String outletId) {
    return find("email = ?1 and outletId = ?2 and status = ?3", email, outletId, Employee.EmployeeStatus.ACTIVE)
      .firstResultOptional();
  }
}
