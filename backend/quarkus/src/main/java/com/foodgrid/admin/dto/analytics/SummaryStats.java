package com.foodgrid.admin.dto.analytics;

import java.math.BigDecimal;

public record SummaryStats(
    long totalOrders,
    BigDecimal totalRevenue,
    BigDecimal averageOrderValue,
    double growthRate
) {}
