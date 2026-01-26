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

    public String issueAccessToken(final Employee employee, final String outletId, final String clientId, final List<String> roles, final String sessionId) {
        final Instant now = Instant.now();
        return Jwt.issuer("foodgrid")
                .subject(employee.id)
                .claim("principalType", "EMPLOYEE")
                .claim("outletId", outletId)
                .claim("clientId", clientId)
                .claim("displayName", employee.displayName)
                .claim("sessionId", sessionId)
                .groups(Set.copyOf(roles))
                .issuedAt(now)
                .expiresAt(now.plus(Duration.ofHours(12)))
                .sign();
    }

    public String issueRefreshToken(final Employee employee, final String outletId, final String clientId, final String sessionId) {
        final Instant now = Instant.now();
        return Jwt.issuer("foodgrid")
                .subject(employee.id)
                .claim("principalType", "EMPLOYEE")
                .claim("outletId", outletId)
                .claim("clientId", clientId)
                .claim("sessionId", sessionId)
                .issuedAt(now)
                .expiresAt(now.plus(Duration.ofDays(7)))
                .sign();
    }

    public String issueAdminAccessToken(final AdminUser admin, final String outletId, final String clientId, final List<String> roles) {
        final Instant now = Instant.now();
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
        if (clientId != null) {
            jwt = jwt.claim("clientId", clientId);
        }

        return jwt.sign();
    }

    public String issueAdminRefreshToken(final AdminUser admin, final String outletId, final String clientId) {
        final Instant now = Instant.now();
        var jwt = Jwt.issuer("foodgrid")
                .subject(admin.id)
                .claim("principalType", "ADMIN")
                .issuedAt(now)
                .expiresAt(now.plus(Duration.ofDays(7)));

        if (outletId != null) {
            jwt = jwt.claim("outletId", outletId);
        }
        if (clientId != null) {
            jwt = jwt.claim("clientId", clientId);
        }

        return jwt.sign();
    }

    public String issueCustomerAccessToken(final com.foodgrid.auth.model.Customer customer) {
        final Instant now = Instant.now();
        String mobileNumber = "";
        String email = "";
        if (customer.mobileNumber != null) {
            mobileNumber = customer.mobileNumber;
        }
        if (customer.email != null) {
            email = customer.email;
        }
        return Jwt.issuer("foodgrid")
                .subject(customer.id)
                .claim("principalType", "CUSTOMER")
                .claim("mobileNumber", mobileNumber)
                .claim("email", email)
                .claim("displayName", customer.displayName)
                .groups(Set.of("CUSTOMER"))
                .issuedAt(now)
                .expiresAt(now.plus(Duration.ofDays(30))) // long lived customer sessions
                .sign();
    }
}
