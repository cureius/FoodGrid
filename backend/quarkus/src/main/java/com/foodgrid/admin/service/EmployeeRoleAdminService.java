package com.foodgrid.admin.service;

import com.foodgrid.admin.dto.EmployeeRolesResponse;
import com.foodgrid.admin.dto.EmployeeRolesUpdateRequest;
import com.foodgrid.auth.model.Employee;
import com.foodgrid.auth.repo.EmployeeRepository;
import com.foodgrid.auth.repo.EmployeeRoleRepository;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.util.List;
import java.util.Set;

@ApplicationScoped
public class EmployeeRoleAdminService {

  private static final Set<String> ALLOWED_ROLES = Set.of("CASHIER", "MANAGER", "ADMIN");

  @Inject EmployeeRepository employeeRepository;
  @Inject EmployeeRoleRepository roleRepository;
  @Inject SecurityIdentity identity;

  public EmployeeRolesResponse get(String outletId, String employeeId) {
    enforceOutlet(outletId);

    Employee e = employeeRepository.findByIdOptional(employeeId)
      .orElseThrow(() -> new NotFoundException("Employee not found"));

    if (!e.outletId.equals(outletId)) {
      throw new BadRequestException("Employee not in outlet");
    }

    List<String> roles = roleRepository.listRoles(employeeId);
    return new EmployeeRolesResponse(employeeId, outletId, roles);
  }

  @Transactional
  public EmployeeRolesResponse update(String outletId, String employeeId, EmployeeRolesUpdateRequest req) {
    enforceOutlet(outletId);

    Employee e = employeeRepository.findByIdOptional(employeeId)
      .orElseThrow(() -> new NotFoundException("Employee not found"));

    if (!e.outletId.equals(outletId)) {
      throw new BadRequestException("Employee not in outlet");
    }

    for (String r : req.roles()) {
      if (r == null || !ALLOWED_ROLES.contains(r)) {
        throw new BadRequestException("Invalid role");
      }
    }

    roleRepository.replaceRoles(employeeId, req.roles());
    return new EmployeeRolesResponse(employeeId, outletId, roleRepository.listRoles(employeeId));
  }

  private void enforceOutlet(String outletId) {
    String tokenOutletId = claim("outletId");
    if (tokenOutletId != null && !tokenOutletId.equals(outletId)) {
      throw new BadRequestException("Not allowed for this outlet");
    }
  }

  private String claim(String name) {
    Object v = identity.getAttributes().get(name);
    return v == null ? null : v.toString();
  }
}
