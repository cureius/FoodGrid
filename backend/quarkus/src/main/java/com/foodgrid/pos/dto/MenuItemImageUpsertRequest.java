package com.foodgrid.pos.dto;

public record MenuItemImageUpsertRequest(
  String imageUrl,
  int sortOrder,
  boolean isPrimary
) {}
