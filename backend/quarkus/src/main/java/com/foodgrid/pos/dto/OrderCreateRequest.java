package com.foodgrid.pos.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;

public record OrderCreateRequest(
  @NotBlank String orderType,
  String tableId,
  String customerName,
  List<OrderAddItemRequest> orderItems,
  String notes
) {}
