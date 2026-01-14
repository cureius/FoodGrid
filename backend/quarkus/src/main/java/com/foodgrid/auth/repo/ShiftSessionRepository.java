package com.foodgrid.auth.repo;

import com.foodgrid.auth.model.ShiftSession;
import com.foodgrid.common.util.Ids;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.Date;

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
}
