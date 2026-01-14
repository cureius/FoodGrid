package com.foodgrid.auth.dto;

import java.util.List;

public record LoginContextResponse(OutletDto outlet, List<EmployeeListItem> employees) {}
