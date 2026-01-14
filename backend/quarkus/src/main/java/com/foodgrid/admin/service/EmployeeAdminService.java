package com.foodgrid.admin.service;

import com.foodgrid.admin.dto.EmployeeResponse;
import com.foodgrid.admin.dto.EmployeeUpsertRequest;
import com.foodgrid.auth.model.Employee;
import com.foodgrid.auth.model.EmployeeCredential;
import com.foodgrid.auth.repo.EmployeeCredentialRepository;
import com.foodgrid.auth.repo.EmployeeRepository;
import com.foodgrid.auth.service.PinHasher;
import com.foodgrid.common.util.Ids;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.time.Instant;
import java.util.Date;
import java.util.List;

@ApplicationScoped
public class EmployeeAdminService {

  @Inject EmployeeRepository employeeRepository;
  @Inject EmployeeCredentialRepository credentialRepository;
  @Inject PinHasher pinHasher;
  @Inject SecurityIdentity identity;

  public List<EmployeeResponse> list(String outletId) {
    // outletId is mandatory from UI; enforce scoping if admin token has outletId claim.
    String tokenOutletId = claim("outletId");
    if (tokenOutletId != null && !tokenOutletId.equals(outletId)) {
      throw new BadRequestException("Not allowed for this outlet");
    }

    return employeeRepository.listByOutlet(outletId).stream()
      .map(EmployeeAdminService::toResponse)
      .toList();
  }

  @Transactional
  public EmployeeResponse create(String outletId, EmployeeUpsertRequest req) {
    String tokenOutletId = claim("outletId");
    if (tokenOutletId != null && !tokenOutletId.equals(outletId)) {
      throw new BadRequestException("Not allowed for this outlet");
    }

    Employee e = new Employee();
    e.id = Ids.uuid();
    e.outletId = outletId;
    e.displayName = req.displayName();
    e.email = req.email();
    e.avatarUrl = req.avatarUrl();

    e.status = parseStatus(req.status());

    employeeRepository.persist(e);

    if (req.pin() != null && !req.pin().isBlank()) {
      validateSixDigit(req.pin());
      EmployeeCredential cred = new EmployeeCredential();
      cred.employeeId = e.id;
      cred.pinHash = pinHasher.hash(req.pin());
      cred.failedPinAttempts = 0;
      cred.pinUpdatedAt = Date.from(Instant.now());
      credentialRepository.persist(cred);
    }

    return toResponse(e);
  }

  @Transactional
  public EmployeeResponse update(String outletId, String employeeId, EmployeeUpsertRequest req) {
    String tokenOutletId = claim("outletId");
    if (tokenOutletId != null && !tokenOutletId.equals(outletId)) {
      throw new BadRequestException("Not allowed for this outlet");
    }

    Employee e = employeeRepository.findByIdOptional(employeeId)
      .orElseThrow(() -> new NotFoundException("Employee not found"));

    if (!e.outletId.equals(outletId)) {
      throw new BadRequestException("Employee not in outlet");
    }

    e.displayName = req.displayName();
    e.email = req.email();
    e.avatarUrl = req.avatarUrl();
    e.status = parseStatus(req.status());

    employeeRepository.persist(e);

    if (req.pin() != null && !req.pin().isBlank()) {
      validateSixDigit(req.pin());
      EmployeeCredential cred = credentialRepository.findByEmployeeId(e.id).orElse(null);
      if (cred == null) {
        cred = new EmployeeCredential();
        cred.employeeId = e.id;
        cred.failedPinAttempts = 0;
      }
      cred.pinHash = pinHasher.hash(req.pin());
      cred.pinUpdatedAt = Date.from(Instant.now());
      credentialRepository.persist(cred);
    }

    return toResponse(e);
  }

  @Transactional
  public void delete(String outletId, String employeeId) {
    String tokenOutletId = claim("outletId");
    if (tokenOutletId != null && !tokenOutletId.equals(outletId)) {
      throw new BadRequestException("Not allowed for this outlet");
    }

    Employee e = employeeRepository.findByIdOptional(employeeId)
      .orElseThrow(() -> new NotFoundException("Employee not found"));

    if (!e.outletId.equals(outletId)) {
      throw new BadRequestException("Employee not in outlet");
    }

    // hard delete to match CRUD requirement (can change to soft delete later)
    credentialRepository.deleteById(e.id);
    employeeRepository.delete(e);
  }

  private String claim(String name) {
    Object v = identity.getAttributes().get(name);
    return v == null ? null : v.toString();
  }

  private static Employee.EmployeeStatus parseStatus(String status) {
    if (status == null || status.isBlank()) return Employee.EmployeeStatus.ACTIVE;
    try {
      return Employee.EmployeeStatus.valueOf(status);
    } catch (IllegalArgumentException ex) {
      throw new BadRequestException("Invalid status");
    }
  }

  private static void validateSixDigit(String value) {
    if (value == null || value.length() != 6 || !value.chars().allMatch(Character::isDigit)) {
      throw new BadRequestException("PIN must be 6 digits");
    }
  }

  private static EmployeeResponse toResponse(Employee e) {
    return new EmployeeResponse(e.id, e.outletId, e.displayName, e.email, e.avatarUrl, e.status.name());
  }
}
