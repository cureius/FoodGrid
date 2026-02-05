package com.foodgrid.admin.service;

import com.foodgrid.admin.dto.*;
import com.foodgrid.admin.model.AdminUser;
import com.foodgrid.admin.repo.AdminUserRepository;
import com.foodgrid.admin.repo.AdminUserRoleRepository;
import com.foodgrid.auth.service.PinHasher;
import com.foodgrid.common.audit.AuditLogService;
import com.foodgrid.common.exception.AuthenticationException;
import com.foodgrid.common.exception.BusinessException;
import com.foodgrid.common.logging.AppLogger;
import com.foodgrid.common.security.JwtIssuer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.List;

@ApplicationScoped
public class AdminAuthService {

  private static final Logger LOG = Logger.getLogger(AdminAuthService.class);

  @Inject AdminUserRepository adminUserRepository;
  @Inject AdminUserRoleRepository roleRepository;
  @Inject PinHasher pinHasher;
  @Inject JwtIssuer jwtIssuer;
  @Inject AuditLogService audit;
  @Inject AppLogger appLogger;

  public AdminLoginResponse login(final AdminLoginRequest request) {
    appLogger.info(LOG, "Admin login attempt for email=%s", request.email());

    final AdminUser admin = adminUserRepository.findByEmail(request.email())
      .orElseThrow(() -> {
        appLogger.logSecurityEvent(LOG, "ADMIN_LOGIN_UNKNOWN_EMAIL", "email=" + request.email());
        return AuthenticationException.invalidCredentials();
      });

    if (admin.status != AdminUser.Status.ACTIVE) {
      appLogger.logSecurityEvent(LOG, "ADMIN_LOGIN_INACTIVE", "email=" + request.email() + ", status=" + admin.status);
      throw BusinessException.adminInactive(request.email());
    }

    if (!pinHasher.matches(request.password(), admin.passwordHash)) {
      appLogger.logSecurityEvent(LOG, "ADMIN_LOGIN_INVALID_PASSWORD", "adminId=" + admin.id);
      throw AuthenticationException.invalidCredentials();
    }

    final List<String> roles = roleRepository.listRoles(admin.id);

    final String clientId = admin.clientId;

    final String accessToken = jwtIssuer.issueAdminAccessToken(admin, null, clientId, roles);
    final String refreshToken = jwtIssuer.issueAdminRefreshToken(admin, null, clientId);

    audit.record("ADMIN_LOGIN", null, "AdminUser", admin.id, "email=" + admin.email);
    appLogger.logSecurityEvent(LOG, "ADMIN_LOGIN_SUCCESS", "adminId=" + admin.id + ", roles=" + roles);

    return new AdminLoginResponse(
      accessToken,
      refreshToken,
      new AdminUserDto(admin.id, admin.email, admin.displayName, roles)
    );
  }
}
