package com.foodgrid.admin.dto.analytics;

import com.foodgrid.admin.dto.ClientResponse;
import java.util.List;

public record GlobalAnalyticsResponse(
    long totalTenants,
    long activeTenants,
    long totalUsers,
    long totalOutlets,
    double totalRevenue,
    long activeSubscriptions,
    List<ClientResponse> recentTenants,
    List<RevenueMetric> revenueByMonth
) {
    public record RevenueMetric(String month, double amount) {}
}
