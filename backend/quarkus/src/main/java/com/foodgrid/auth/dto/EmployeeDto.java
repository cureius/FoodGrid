package com.foodgrid.auth.dto;

import java.util.List;

public record EmployeeDto(String id, String displayName, List<String> roles) {}
