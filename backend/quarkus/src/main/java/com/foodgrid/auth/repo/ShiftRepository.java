package com.foodgrid.auth.repo;

import com.foodgrid.auth.model.Shift;
import com.foodgrid.common.util.Ids;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.Date;
import java.util.Optional;

@ApplicationScoped
public class ShiftRepository implements PanacheRepositoryBase<Shift, String> {
  public Optional<Shift> findActive(String outletId, String employeeId, String deviceId) {
    return find(
      "outletId = ?1 and employeeId = ?2 and deviceId = ?3 and status = ?4",
      outletId,
      employeeId,
      deviceId,
      Shift.ShiftStatus.ACTIVE
    )
      .firstResultOptional();
  }

  public Optional<Shift> findActiveById(String shiftId) {
    return find("id = ?1 and status = ?2", shiftId, Shift.ShiftStatus.ACTIVE).firstResultOptional();
  }

  public Shift createActive(String outletId, String employeeId, String deviceId) {
    Shift s = new Shift();
    s.id = Ids.uuid();
    s.outletId = outletId;
    s.employeeId = employeeId;
    s.deviceId = deviceId;
    s.startedAt = Date.from(Instant.now());
    s.status = Shift.ShiftStatus.ACTIVE;
    persist(s);
    return s;
  }

  public void closeShift(String shiftId) {
    Shift s = findByIdOptional(shiftId).orElse(null);
    if (s == null) return;
    if (s.status != Shift.ShiftStatus.ACTIVE) return;
    s.status = Shift.ShiftStatus.CLOSED;
    s.endedAt = Date.from(Instant.now());
    persist(s);
  }
}
