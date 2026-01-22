package com.foodgrid.admin.dto;

import java.util.Date;

public record ClientResponse(
  String id,
  String name,
  String contactEmail,
  String status,
  Date createdAt,
  Date updatedAt,
  String adminUserId,
  String adminEmail,
  String adminDisplayName,
  String adminPassword
) {}

