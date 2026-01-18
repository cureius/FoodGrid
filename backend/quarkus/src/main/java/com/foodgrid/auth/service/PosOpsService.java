package com.foodgrid.auth.service;

import com.foodgrid.auth.dto.LogoutResponse;
import com.foodgrid.auth.dto.ShiftCloseResponse;
import com.foodgrid.auth.model.ShiftSession;
import com.foodgrid.auth.repo.ShiftRepository;
import com.foodgrid.auth.repo.ShiftSessionRepository;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import org.eclipse.microprofile.jwt.JsonWebToken;

@ApplicationScoped
public class PosOpsService {

  @Inject ShiftSessionRepository sessionRepository;
  @Inject ShiftRepository shiftRepository;
  @Inject SecurityIdentity identity;
  @Inject JsonWebToken jwt;

  @Transactional
  public LogoutResponse logout() {
    final String sessionId = claim("sessionId");
    if (sessionId == null || sessionId.isBlank()) {
      throw new BadRequestException("Missing sessionId");
    }
    sessionRepository.revoke(sessionId);
    return new LogoutResponse("OK");
  }

  @Transactional
  public ShiftCloseResponse closeShift() {
    final String sessionId = claim("sessionId");
    if (sessionId == null || sessionId.isBlank()) {
      throw new BadRequestException("Missing sessionId");
    }

    final ShiftSession ss = sessionRepository.findActiveById(sessionId)
      .orElseThrow(() -> new NotFoundException("Session not found"));

    shiftRepository.closeShift(ss.shiftId);
    sessionRepository.revokeByShiftId(ss.shiftId);

    return new ShiftCloseResponse("CLOSED", ss.shiftId);
  }

  private String claim(final String name) {
    // Prefer JWT claims
    if (jwt != null) {
      try {
        final Object c = jwt.getClaim(name);
        if (c != null) {
          final String s = c.toString();
          if (!s.isBlank()) return s;
        }
      } catch (final Exception ignored) {
        // fall through
      }
    }

    // Fallback
    final Object v = identity.getAttributes().get(name);
    return v == null ? null : v.toString();
  }
}
