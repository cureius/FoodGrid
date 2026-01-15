package com.foodgrid.auth.repo;

import com.foodgrid.auth.model.ShiftSession;
import com.foodgrid.common.util.Ids;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.Date;
import java.util.Optional;

@ApplicationScoped
public class ShiftSessionRepository implements PanacheRepositoryBase<ShiftSession, String> {
  public ShiftSession create(String shiftId, String deviceId) {
    ShiftSession ss = new ShiftSession();
    ss.id = Ids.uuid();
    ss.shiftId = shiftId;
    ss.deviceId = deviceId;
    ss.createdAt = Date.from(Instant.now());
    persist(ss);
    return ss;
  }

  public Optional<ShiftSession> findActiveById(String sessionId) {
    return find("id = ?1 and revokedAt is null", sessionId).firstResultOptional();
  }

  public void revoke(String sessionId) {
    ShiftSession ss = findByIdOptional(sessionId).orElse(null);
    if (ss == null) return;
    if (ss.revokedAt != null) return;
    ss.revokedAt = Date.from(Instant.now());
    persist(ss);
  }

  public int revokeByShiftId(String shiftId) {
    return update("revokedAt = ?1 where shiftId = ?2 and revokedAt is null", Date.from(Instant.now()), shiftId);
  }
}
