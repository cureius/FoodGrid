package com.foodgrid.pos.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
  String id,
  String outletId,
  String deviceId,
  String shiftId,
  String employeeId,
  String tableId,
  String orderType,
  String status,
  BigDecimal subtotal,
  BigDecimal taxTotal,
  BigDecimal discountTotal,
  BigDecimal grandTotal,
  String notes,
  Instant createdAt,
  String outletName, // Added
  List<OrderItemResponse> items
) {}
