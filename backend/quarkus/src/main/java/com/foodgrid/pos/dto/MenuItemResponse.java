package com.foodgrid.pos.dto;

import java.math.BigDecimal;

public record MenuItemResponse(
  String id,
  String outletId,
  String categoryId,
  String name,
  String description,
  boolean isVeg,
  BigDecimal basePrice,
  String status
) {}
