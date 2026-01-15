package com.foodgrid.pos.dto;

public record DiningTableResponse(
  String id,
  String outletId,
  String tableCode,
  String displayName,
  int capacity,
  String status
) {}
