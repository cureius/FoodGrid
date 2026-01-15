package com.foodgrid.pos.dto;

import java.math.BigDecimal;

public record OrderItemResponse(
  String id,
  String itemId,
  String itemName,
  BigDecimal qty,
  BigDecimal unitPrice,
  BigDecimal lineTotal,
  String status
) {}
