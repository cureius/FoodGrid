package com.foodgrid.common.security;

import com.foodgrid.auth.model.Employee;
import com.foodgrid.admin.model.AdminUser;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@ApplicationScoped
public class JwtIssuer {

  public String issueAccessToken(Employee employee, String outletId, List<String> roles, String sessionId) {
    Instant now = Instant.now();
    return Jwt.issuer("foodgrid")
      .subject(employee.id)
      .claim("outletId", outletId)
      .claim("displayName", employee.displayName)
      .claim("sessionId", sessionId)
      .groups(Set.copyOf(roles))
      .issuedAt(now)
      .expiresAt(now.plus(Duration.ofHours(12)))
      .sign();
  }

  public String issueRefreshToken(Employee employee, String outletId, String sessionId) {
    Instant now = Instant.now();
    return Jwt.issuer("foodgrid")
      .subject(employee.id)
      .claim("outletId", outletId)
      .claim("sessionId", sessionId)
      .issuedAt(now)
      .expiresAt(now.plus(Duration.ofDays(7)))
      .sign();
  }

  public String issueAdminAccessToken(AdminUser admin, String outletId, List<String> roles) {
    Instant now = Instant.now();
    var jwt = Jwt.issuer("foodgrid")
      .subject(admin.id)
      .claim("principalType", "ADMIN")
      .claim("email", admin.email)
      .claim("displayName", admin.displayName)
      .groups(Set.copyOf(roles))
      .issuedAt(now)
      .expiresAt(now.plus(Duration.ofHours(12)));

    if (outletId != null) {
      jwt = jwt.claim("outletId", outletId);
    }

    return jwt.sign();
  }

  public String issueAdminRefreshToken(AdminUser admin, String outletId) {
    Instant now = Instant.now();
    var jwt = Jwt.issuer("foodgrid")
      .subject(admin.id)
      .claim("principalType", "ADMIN")
      .issuedAt(now)
      .expiresAt(now.plus(Duration.ofDays(7)));

    if (outletId != null) {
      jwt = jwt.claim("outletId", outletId);
    }

    return jwt.sign();
  }
}
