package com.foodgrid.pos.dto;

public record MenuItemImageResponse(
  String id,
  String imageUrl,
  int sortOrder,
  boolean isPrimary
) {}
