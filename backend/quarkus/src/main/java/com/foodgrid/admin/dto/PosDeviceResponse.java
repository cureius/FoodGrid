package com.foodgrid.admin.dto;

public record PosDeviceResponse(
  String id,
  String outletId,
  String deviceCode,
  String name
) {}
