package com.foodgrid.admin.service;

import com.foodgrid.admin.dto.*;
import com.foodgrid.admin.model.AdminUser;
import com.foodgrid.admin.repo.AdminUserRepository;
import com.foodgrid.admin.repo.AdminUserRoleRepository;
import com.foodgrid.auth.service.PinHasher;
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

  public AdminLoginResponse login(AdminLoginRequest request) {
    AdminUser admin = adminUserRepository.findByEmail(request.email())
      .orElseThrow(() -> new ForbiddenException("Invalid credentials"));

    if (admin.status != AdminUser.Status.ACTIVE) {
      throw new ForbiddenException("Inactive admin");
    }

    if (!pinHasher.matches(request.password(), admin.passwordHash)) {
      throw new ForbiddenException("Invalid credentials");
    }

    List<String> roles = roleRepository.listRoles(admin.id);
    String outletId = admin.outletId;

    String accessToken = jwtIssuer.issueAdminAccessToken(admin, outletId, roles);
    String refreshToken = jwtIssuer.issueAdminRefreshToken(admin, outletId);

    return new AdminLoginResponse(
      accessToken,
      refreshToken,
      new AdminUserDto(admin.id, admin.email, admin.displayName, roles)
    );
  }
}
