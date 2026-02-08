package com.foodgrid.admin.dto.analytics;

import java.math.BigDecimal;
import java.util.List;

public record PerformanceMetric(
    String label,
    long count,
    BigDecimal revenue
) {}
