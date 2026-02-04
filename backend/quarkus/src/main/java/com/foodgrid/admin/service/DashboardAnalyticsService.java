package com.foodgrid.admin.service;

import com.foodgrid.admin.dto.analytics.*;
import com.foodgrid.pos.repo.OrderRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class DashboardAnalyticsService {

    @Inject EntityManager em;
    @Inject OrderRepository orderRepository;

    public DashboardAnalyticsResponse getAnalytics(String outletId, Instant start, Instant end) {
        SummaryStats summary = getSummaryStats(outletId, start, end);
        List<PerformanceMetric> channelSplit = getChannelSplit(outletId, start, end);
        List<PerformanceMetric> topItemsByQuantity = getTopItemsByQuantity(outletId, start, end);
        List<PerformanceMetric> topItemsByRevenue = getTopItemsByRevenue(outletId, start, end);
        List<DashboardAnalyticsResponse.HourlyData> hourlyTrend = getHourlyTrend(outletId, start, end);
        List<String> insights = generateInsights(summary, channelSplit);

        return new DashboardAnalyticsResponse(
            summary,
            channelSplit,
            topItemsByQuantity,
            topItemsByRevenue,
            new ArrayList<>(), // Category split could be added if needed
            hourlyTrend,
            insights
        );
    }

    private SummaryStats getSummaryStats(String outletId, Instant start, Instant end) {
        Object[] result = (Object[]) em.createQuery(
            "SELECT COUNT(o), SUM(o.grandTotal) FROM Order o WHERE o.outletId = :outletId AND o.createdAt >= :start AND o.createdAt <= :end AND o.status != 'CANCELLED'")
            .setParameter("outletId", outletId)
            .setParameter("start", start)
            .setParameter("end", end)
            .getSingleResult();

        long count = (Long) (result[0] != null ? result[0] : 0L);
        BigDecimal revenue = (BigDecimal) (result[1] != null ? result[1] : BigDecimal.ZERO);
        BigDecimal avg = count > 0 ? revenue.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        return new SummaryStats(count, revenue, avg, 0.0); // Growth rate needs previous period comparison
    }

    @SuppressWarnings("unchecked")
    private List<PerformanceMetric> getChannelSplit(String outletId, Instant start, Instant end) {
        List<Object[]> results = em.createQuery(
            "SELECT o.sourceChannel, COUNT(o), SUM(o.grandTotal) FROM Order o WHERE o.outletId = :outletId AND o.createdAt >= :start AND o.createdAt <= :end AND o.status != 'CANCELLED' GROUP BY o.sourceChannel")
            .setParameter("outletId", outletId)
            .setParameter("start", start)
            .setParameter("end", end)
            .getResultList();

        return results.stream()
            .map(r -> new PerformanceMetric(r[0].toString(), (Long) r[1], (BigDecimal) r[2]))
            .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    private List<PerformanceMetric> getTopItemsByQuantity(String outletId, Instant start, Instant end) {
        List<Object[]> results = em.createQuery(
            "SELECT oi.itemName, SUM(oi.qty), SUM(oi.lineTotal) FROM OrderItem oi JOIN Order o ON oi.orderId = o.id WHERE o.outletId = :outletId AND o.createdAt >= :start AND o.createdAt <= :end AND o.status != 'CANCELLED' GROUP BY oi.itemName ORDER BY SUM(oi.qty) DESC")
            .setParameter("outletId", outletId)
            .setParameter("start", start)
            .setParameter("end", end)
            .setMaxResults(5)
            .getResultList();

        return results.stream()
            .map(r -> new PerformanceMetric((String) r[0], ((BigDecimal) r[1]).longValue(), (BigDecimal) r[2]))
            .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    private List<PerformanceMetric> getTopItemsByRevenue(String outletId, Instant start, Instant end) {
        List<Object[]> results = em.createQuery(
            "SELECT oi.itemName, SUM(oi.qty), SUM(oi.lineTotal) FROM OrderItem oi JOIN Order o ON oi.orderId = o.id WHERE o.outletId = :outletId AND o.createdAt >= :start AND o.createdAt <= :end AND o.status != 'CANCELLED' GROUP BY oi.itemName ORDER BY SUM(oi.lineTotal) DESC")
            .setParameter("outletId", outletId)
            .setParameter("start", start)
            .setParameter("end", end)
            .setMaxResults(5)
            .getResultList();

        return results.stream()
            .map(r -> new PerformanceMetric((String) r[0], ((BigDecimal) r[1]).longValue(), (BigDecimal) r[2]))
            .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    private List<DashboardAnalyticsResponse.HourlyData> getHourlyTrend(String outletId, Instant start, Instant end) {
        // This is a bit tricky with JPQL across different DBs. 
        // For simplicity, we can do it in memory or use a native query if H2/Postgres specific.
        // Let's use a native query for SQLite/H2/Postgres compat if possible or just group in memory for now if results are not too many.
        // Better: Native query for Postgres/H2 extract hour.
        
        String nativeQuery = "SELECT EXTRACT(HOUR FROM created_at) as hr, COUNT(*), SUM(grand_total) " +
                           "FROM orders " +
                           "WHERE outlet_id = :outletId AND created_at >= :start AND created_at <= :end AND status != 'CANCELLED' " +
                           "GROUP BY hr ORDER BY hr";
        
        List<Object[]> results = em.createNativeQuery(nativeQuery)
            .setParameter("outletId", outletId)
            .setParameter("start", start)
            .setParameter("end", end)
            .getResultList();

        return results.stream()
            .map(r -> new DashboardAnalyticsResponse.HourlyData(
                ((Number) r[0]).intValue(), 
                ((Number) r[1]).longValue(), 
                (BigDecimal) r[2]))
            .collect(Collectors.toList());
    }

    private List<String> generateInsights(SummaryStats summary, List<PerformanceMetric> channelSplit) {
        List<String> insights = new ArrayList<>();
        if (summary.totalOrders() > 0) {
            insights.add("Your Average Order Value (AOV) is " + summary.averageOrderValue() + ".");
        }
        
        channelSplit.stream()
            .max((a, b) -> a.revenue().compareTo(b.revenue()))
            .ifPresent(top -> insights.add(top.label() + " is your top performing channel, contributing " + top.revenue() + " in revenue."));
            
        return insights;
    }
}
