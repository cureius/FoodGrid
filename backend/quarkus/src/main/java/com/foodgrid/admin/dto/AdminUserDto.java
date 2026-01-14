package com.foodgrid.admin.dto;

import java.util.List;

public record AdminUserDto(String id, String email, String displayName, List<String> roles) {}
