package com.foodgrid.admin.service;

import com.foodgrid.admin.dto.*;
import com.foodgrid.admin.model.AdminUser;
import com.foodgrid.admin.repo.AdminUserRepository;
import com.foodgrid.admin.repo.AdminUserRoleRepository;
import com.foodgrid.auth.service.PinHasher;
import com.foodgrid.common.audit.AuditLogService;
import com.foodgrid.common.security.JwtIssuer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.ForbiddenException;

import java.util.List;

@ApplicationScoped
public class AdminAuthService {

  @Inject AdminUserRepository adminUserRepository;
  @Inject AdminUserRoleRepository roleRepository;
  @Inject PinHasher pinHasher;
  @Inject JwtIssuer jwtIssuer;
  @Inject AuditLogService audit;

  public AdminLoginResponse login(final AdminLoginRequest request) {
    final AdminUser admin = adminUserRepository.findByEmail(request.email())
      .orElseThrow(() -> new ForbiddenException("Invalid credentials"));

    if (admin.status != AdminUser.Status.ACTIVE) {
      throw new ForbiddenException("Inactive admin");
    }

    if (!pinHasher.matches(request.password(), admin.passwordHash)) {
      throw new ForbiddenException("Invalid credentials");
    }

    final List<String> roles = roleRepository.listRoles(admin.id);

    // NOTE: AdminUser currently isn't linked to a Client. Until it is, admin tokens remain non-tenant-scoped.
    final String clientId = null;

    final String accessToken = jwtIssuer.issueAdminAccessToken(admin, null, clientId, roles);
    final String refreshToken = jwtIssuer.issueAdminRefreshToken(admin, null, clientId);

    audit.record("ADMIN_LOGIN", null, "AdminUser", admin.id, "email=" + admin.email);

    return new AdminLoginResponse(
      accessToken,
      refreshToken,
      new AdminUserDto(admin.id, admin.email, admin.displayName, roles)
    );
  }
}
