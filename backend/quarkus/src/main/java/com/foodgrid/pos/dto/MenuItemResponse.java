package com.foodgrid.pos.dto;

import java.math.BigDecimal;
import java.util.List;

public record MenuItemResponse(
  String id,
  String outletId,
  String categoryId,
  String categoryName,
  String name,
  String description,
  boolean isVeg,
  BigDecimal basePrice,
  String status,
  List<MenuItemImageResponse> images,
  List<MenuItemRecipeResponse> recipes
) {}
