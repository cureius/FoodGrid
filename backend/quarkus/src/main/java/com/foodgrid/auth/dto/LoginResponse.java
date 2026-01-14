package com.foodgrid.auth.dto;

import com.foodgrid.auth.model.Employee;
import com.foodgrid.auth.model.Outlet;
import com.foodgrid.auth.model.Shift;
import com.foodgrid.auth.model.ShiftSession;

import java.util.List;

public record LoginResponse(
  String accessToken,
  String refreshToken,
  EmployeeDto employee,
  OutletDto outlet,
  ShiftDto shift,
  SessionDto session
) {
  public static LoginResponse from(
    Employee e,
    Outlet o,
    List<String> roles,
    Shift s,
    ShiftSession sess,
    String accessToken,
    String refreshToken
  ) {
    return new LoginResponse(
      accessToken,
      refreshToken,
      new EmployeeDto(e.id, e.displayName, roles),
      new OutletDto(o.id, o.name, o.timezone),
      new ShiftDto(s.id, s.status.name(), s.startedAt.toInstant().toString()),
      new SessionDto(sess.id, sess.deviceId, sess.createdAt.toInstant().toString())
    );
  }
}
