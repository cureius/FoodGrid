package com.foodgrid.admin.dto;

public record AdminLoginResponse(
  String accessToken,
  String refreshToken,
  AdminUserDto admin
) {}
