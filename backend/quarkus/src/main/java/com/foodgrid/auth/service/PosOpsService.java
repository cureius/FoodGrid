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

@ApplicationScoped
public class PosOpsService {

  @Inject ShiftSessionRepository sessionRepository;
  @Inject ShiftRepository shiftRepository;
  @Inject SecurityIdentity identity;

  @Transactional
  public LogoutResponse logout() {
    String sessionId = claim("sessionId");
    if (sessionId == null || sessionId.isBlank()) {
      throw new BadRequestException("Missing sessionId");
    }
    sessionRepository.revoke(sessionId);
    return new LogoutResponse("OK");
  }

  @Transactional
  public ShiftCloseResponse closeShift() {
    String sessionId = claim("sessionId");
    if (sessionId == null || sessionId.isBlank()) {
      throw new BadRequestException("Missing sessionId");
    }

    ShiftSession ss = sessionRepository.findActiveById(sessionId)
      .orElseThrow(() -> new NotFoundException("Session not found"));

    shiftRepository.closeShift(ss.shiftId);
    sessionRepository.revokeByShiftId(ss.shiftId);

    return new ShiftCloseResponse("CLOSED", ss.shiftId);
  }

  private String claim(String name) {
    Object v = identity.getAttributes().get(name);
    return v == null ? null : v.toString();
  }
}
