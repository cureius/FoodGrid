package com.foodgrid.admin.dto;

public record ShiftScheduleResponse(
  String id,
  String outletId,
  String employeeId,
  String startAt,
  String endAt
) {}
