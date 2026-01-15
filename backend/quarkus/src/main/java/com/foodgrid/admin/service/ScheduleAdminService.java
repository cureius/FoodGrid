package com.foodgrid.admin.service;

import com.foodgrid.admin.dto.ShiftScheduleResponse;
import com.foodgrid.admin.dto.ShiftScheduleUpsertRequest;
import com.foodgrid.auth.model.Employee;
import com.foodgrid.auth.model.EmployeeShiftSchedule;
import com.foodgrid.auth.repo.EmployeeRepository;
import com.foodgrid.auth.repo.ScheduleRepository;
import com.foodgrid.common.util.Ids;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.time.Instant;
import java.util.Date;
import java.util.List;

@ApplicationScoped
public class ScheduleAdminService {

  @Inject ScheduleRepository scheduleRepository;
  @Inject EmployeeRepository employeeRepository;
  @Inject SecurityIdentity identity;

  public List<ShiftScheduleResponse> list(String outletId, String employeeId, String from, String to) {
    enforceOutlet(outletId);

    if (from == null || from.isBlank() || to == null || to.isBlank()) {
      throw new BadRequestException("from and to are required");
    }

    Date fromDate = Date.from(Instant.parse(from));
    Date toDate = Date.from(Instant.parse(to));

    List<EmployeeShiftSchedule> rows;
    if (employeeId != null && !employeeId.isBlank()) {
      rows = scheduleRepository.listByEmployeeBetween(outletId, employeeId, fromDate, toDate);
    } else {
      rows = scheduleRepository.listByOutletBetween(outletId, fromDate, toDate);
    }

    return rows.stream().map(ScheduleAdminService::toResponse).toList();
  }

  @Transactional
  public ShiftScheduleResponse create(String outletId, ShiftScheduleUpsertRequest req) {
    enforceOutlet(outletId);

    Employee e = employeeRepository.findByIdOptional(req.employeeId())
      .orElseThrow(() -> new NotFoundException("Employee not found"));

    if (!e.outletId.equals(outletId)) {
      throw new BadRequestException("Employee not in outlet");
    }

    EmployeeShiftSchedule s = new EmployeeShiftSchedule();
    s.id = Ids.uuid();
    s.outletId = outletId;
    s.employeeId = req.employeeId();
    s.startAt = Date.from(Instant.parse(req.startAt()));
    s.endAt = Date.from(Instant.parse(req.endAt()));
    s.createdAt = Date.from(Instant.now());

    scheduleRepository.persist(s);
    return toResponse(s);
  }

  @Transactional
  public ShiftScheduleResponse update(String outletId, String scheduleId, ShiftScheduleUpsertRequest req) {
    enforceOutlet(outletId);

    EmployeeShiftSchedule s = scheduleRepository.findByIdOptional(scheduleId)
      .orElseThrow(() -> new NotFoundException("Schedule not found"));

    if (!s.outletId.equals(outletId)) {
      throw new BadRequestException("Schedule not in outlet");
    }

    Employee e = employeeRepository.findByIdOptional(req.employeeId())
      .orElseThrow(() -> new NotFoundException("Employee not found"));

    if (!e.outletId.equals(outletId)) {
      throw new BadRequestException("Employee not in outlet");
    }

    s.employeeId = req.employeeId();
    s.startAt = Date.from(Instant.parse(req.startAt()));
    s.endAt = Date.from(Instant.parse(req.endAt()));
    scheduleRepository.persist(s);

    return toResponse(s);
  }

  @Transactional
  public void delete(String outletId, String scheduleId) {
    enforceOutlet(outletId);

    EmployeeShiftSchedule s = scheduleRepository.findByIdOptional(scheduleId)
      .orElseThrow(() -> new NotFoundException("Schedule not found"));

    if (!s.outletId.equals(outletId)) {
      throw new BadRequestException("Schedule not in outlet");
    }

    scheduleRepository.delete(s);
  }

  private void enforceOutlet(String outletId) {
    String tokenOutletId = claim("outletId");
    if (tokenOutletId != null && !tokenOutletId.equals(outletId)) {
      throw new BadRequestException("Not allowed for this outlet");
    }
  }

  private String claim(String name) {
    Object v = identity.getAttributes().get(name);
    return v == null ? null : v.toString();
  }

  private static ShiftScheduleResponse toResponse(EmployeeShiftSchedule s) {
    return new ShiftScheduleResponse(
      s.id,
      s.outletId,
      s.employeeId,
      s.startAt.toInstant().toString(),
      s.endAt.toInstant().toString()
    );
  }
}
