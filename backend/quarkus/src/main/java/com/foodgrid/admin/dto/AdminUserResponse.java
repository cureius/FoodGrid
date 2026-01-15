package com.foodgrid.admin.dto;

import java.util.List;

public record AdminUserResponse(
  String id,
  String outletId,
  String email,
  String displayName,
  String status,
  List<String> roles
) {}
