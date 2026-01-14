package com.foodgrid.admin.dto;

public record EmployeeResponse(
  String id,
  String outletId,
  String displayName,
  String email,
  String avatarUrl,
  String status
) {}
