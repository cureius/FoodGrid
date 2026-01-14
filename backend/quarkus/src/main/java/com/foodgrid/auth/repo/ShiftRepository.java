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
  public Optional<Shift> findActive(String outletId, String employeeId) {
    return find("outletId = ?1 and employeeId = ?2 and status = ?3", outletId, employeeId, Shift.ShiftStatus.ACTIVE)
      .firstResultOptional();
  }

  public Shift createActive(String outletId, String employeeId) {
    Shift s = new Shift();
    s.id = Ids.uuid();
    s.outletId = outletId;
    s.employeeId = employeeId;
    s.startedAt = Date.from(Instant.now());
    s.status = Shift.ShiftStatus.ACTIVE;
    persist(s);
    return s;
  }
}
