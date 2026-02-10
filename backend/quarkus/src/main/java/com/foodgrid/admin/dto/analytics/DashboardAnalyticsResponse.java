package com.foodgrid.admin.dto.analytics;

import java.util.List;

public record DashboardAnalyticsResponse(
    SummaryStats summary,
    List<PerformanceMetric> channelSplit,
    List<PerformanceMetric> topItemsByQuantity,
    List<PerformanceMetric> topItemsByRevenue,
    List<PerformanceMetric> topOutletsByRevenue,
    List<PerformanceMetric> categorySplit,
    List<HourlyData> hourlyTrend,
    List<String> insights
) {
    public record HourlyData(int hour, long count, java.math.BigDecimal revenue) {}
}
