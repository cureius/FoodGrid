package com.foodgrid.admin.service;

import com.foodgrid.admin.dto.*;
import com.foodgrid.admin.model.AdminUser;
import com.foodgrid.admin.repo.AdminUserRepository;
import com.foodgrid.admin.repo.AdminUserRoleRepository;
import com.foodgrid.auth.service.PinHasher;
import com.foodgrid.common.util.Ids;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.util.List;
import java.util.Set;

@ApplicationScoped
public class AdminUserAdminService {

  private static final Set<String> ALLOWED_ROLES = Set.of("ADMIN", "MANAGER");

  @Inject AdminUserRepository adminUserRepository;
  @Inject AdminUserRoleRepository roleRepository;
  @Inject PinHasher pinHasher;
  @Inject SecurityIdentity identity;

  public List<AdminUserResponse> list(String outletId) {
    String tokenOutletId = claim("outletId");

    if (tokenOutletId != null && !tokenOutletId.isBlank()) {
      outletId = tokenOutletId;
    }

    List<AdminUser> admins;
    if (outletId == null || outletId.isBlank()) {
      admins = adminUserRepository.listAll();
    } else {
      admins = adminUserRepository.list("outletId", outletId);
    }

    return admins.stream().map(a -> toResponse(a, roleRepository.listRoles(a.id))).toList();
  }

  @Transactional
  public AdminUserResponse create(AdminUserCreateRequest req) {
    String tokenOutletId = claim("outletId");
    String outletId = req.outletId();

    if (tokenOutletId != null && !tokenOutletId.isBlank()) {
      outletId = tokenOutletId;
    }

    adminUserRepository.findByEmail(req.email()).ifPresent(u -> {
      throw new BadRequestException("Email already exists");
    });

    AdminUser a = new AdminUser();
    a.id = Ids.uuid();
    a.outletId = (outletId == null || outletId.isBlank()) ? null : outletId;
    a.email = req.email();
    a.passwordHash = pinHasher.hash(req.password());
    a.displayName = req.displayName();
    a.status = parseStatus(req.status());

    adminUserRepository.persist(a);

    List<String> roles = roleRepository.listRoles(a.id);
    return toResponse(a, roles);
  }

  @Transactional
  public AdminUserResponse update(String adminUserId, AdminUserUpdateRequest req) {
    String tokenOutletId = claim("outletId");

    AdminUser a = adminUserRepository.findByIdOptional(adminUserId)
      .orElseThrow(() -> new NotFoundException("Admin user not found"));

    if (tokenOutletId != null && !tokenOutletId.isBlank()) {
      if (a.outletId == null || !a.outletId.equals(tokenOutletId)) {
        throw new BadRequestException("Not allowed for this outlet");
      }
      a.outletId = tokenOutletId;
    } else {
      a.outletId = (req.outletId() == null || req.outletId().isBlank()) ? null : req.outletId();
    }

    a.email = req.email();
    a.displayName = req.displayName();
    a.status = parseStatus(req.status());

    if (req.password() != null && !req.password().isBlank()) {
      a.passwordHash = pinHasher.hash(req.password());
    }

    adminUserRepository.persist(a);

    return toResponse(a, roleRepository.listRoles(a.id));
  }

  @Transactional
  public void delete(String adminUserId) {
    String tokenOutletId = claim("outletId");

    AdminUser a = adminUserRepository.findByIdOptional(adminUserId)
      .orElseThrow(() -> new NotFoundException("Admin user not found"));

    if (tokenOutletId != null && !tokenOutletId.isBlank()) {
      if (a.outletId == null || !a.outletId.equals(tokenOutletId)) {
        throw new BadRequestException("Not allowed for this outlet");
      }
    }

    roleRepository.replaceRoles(adminUserId, List.of());
    adminUserRepository.delete(a);
  }

  @Transactional
  public AdminUserResponse updateRoles(String adminUserId, AdminUserRolesUpdateRequest req) {
    String tokenOutletId = claim("outletId");

    AdminUser a = adminUserRepository.findByIdOptional(adminUserId)
      .orElseThrow(() -> new NotFoundException("Admin user not found"));

    if (tokenOutletId != null && !tokenOutletId.isBlank()) {
      if (a.outletId == null || !a.outletId.equals(tokenOutletId)) {
        throw new BadRequestException("Not allowed for this outlet");
      }
    }

    for (String r : req.roles()) {
      if (r == null || !ALLOWED_ROLES.contains(r)) {
        throw new BadRequestException("Invalid role");
      }
    }

    roleRepository.replaceRoles(adminUserId, req.roles());

    return toResponse(a, roleRepository.listRoles(adminUserId));
  }

  private String claim(String name) {
    Object v = identity.getAttributes().get(name);
    return v == null ? null : v.toString();
  }

  private static AdminUser.Status parseStatus(String status) {
    if (status == null || status.isBlank()) return AdminUser.Status.ACTIVE;
    try {
      return AdminUser.Status.valueOf(status);
    } catch (IllegalArgumentException ex) {
      throw new BadRequestException("Invalid status");
    }
  }

  private static AdminUserResponse toResponse(AdminUser a, List<String> roles) {
    return new AdminUserResponse(a.id, a.outletId, a.email, a.displayName, a.status.name(), roles);
  }
}
