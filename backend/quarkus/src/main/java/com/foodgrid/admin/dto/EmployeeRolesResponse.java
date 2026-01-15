package com.foodgrid.admin.dto;

import java.util.List;

public record EmployeeRolesResponse(
  String employeeId,
  String outletId,
  List<String> roles
) {}
