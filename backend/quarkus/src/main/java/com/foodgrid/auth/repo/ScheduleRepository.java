package com.foodgrid.auth.repo;

import com.foodgrid.auth.model.EmployeeShiftSchedule;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.Optional;

@ApplicationScoped
public class ScheduleRepository implements PanacheRepositoryBase<EmployeeShiftSchedule, String> {
  public Optional<EmployeeShiftSchedule> findTodaySchedule(String employeeId, String outletId) {
    LocalDate today = LocalDate.now(ZoneId.of("UTC"));
    Instant start = today.atStartOfDay(ZoneId.of("UTC")).toInstant();
    Instant end = today.plusDays(1).atStartOfDay(ZoneId.of("UTC")).toInstant();

    return find("employeeId = ?1 and outletId = ?2 and startAt >= ?3 and startAt < ?4 order by startAt asc",
      employeeId, outletId, Date.from(start), Date.from(end)).firstResultOptional();
  }
}
