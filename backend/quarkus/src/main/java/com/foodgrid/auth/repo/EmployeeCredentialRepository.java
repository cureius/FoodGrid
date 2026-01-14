package com.foodgrid.auth.repo;

import com.foodgrid.auth.model.EmployeeCredential;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

@ApplicationScoped
public class EmployeeCredentialRepository implements PanacheRepositoryBase<EmployeeCredential, String> {
  public Optional<EmployeeCredential> findByEmployeeId(String employeeId) {
    return findByIdOptional(employeeId);
  }

  public void incrementFailedAttempts(String employeeId) {
    update("failedPinAttempts = failedPinAttempts + 1 where employeeId = ?1", employeeId);
  }

  public void resetFailedAttempts(String employeeId) {
    update("failedPinAttempts = 0, lockedUntil = null where employeeId = ?1", employeeId);
  }
}
