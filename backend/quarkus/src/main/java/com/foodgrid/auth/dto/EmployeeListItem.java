package com.foodgrid.auth.dto;

public record EmployeeListItem(String id, String displayName, String avatarUrl, ShiftTimeRange scheduledShift) {}
