package com.foodgrid.pos.dto;

import java.math.BigDecimal;

public record PaymentResponse(
  String id,
  String orderId,
  String method,
  BigDecimal amount,
  String status
) {}
