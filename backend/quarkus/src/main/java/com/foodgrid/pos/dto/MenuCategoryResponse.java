package com.foodgrid.pos.dto;

public record MenuCategoryResponse(
  String id,
  String outletId,
  String name,
  int sortOrder,
  String status
) {}
