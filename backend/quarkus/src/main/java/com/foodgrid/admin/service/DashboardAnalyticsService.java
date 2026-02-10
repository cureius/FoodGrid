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

    public DashboardAnalyticsResponse getAnalytics(final String outletId, final Instant start, final Instant end) {
        final SummaryStats summary = getSummaryStats(outletId, start, end);
        final List<PerformanceMetric> channelSplit = getChannelSplit(outletId, start, end);
        final List<PerformanceMetric> topItemsByQuantity = getTopItemsByQuantity(outletId, start, end);
        final List<PerformanceMetric> topItemsByRevenue = getTopItemsByRevenue(outletId, start, end);
        final List<PerformanceMetric> topOutletsByRevenue = getTopOutletsByRevenue(outletId, start, end);
        final List<DashboardAnalyticsResponse.HourlyData> hourlyTrend = getHourlyTrend(outletId, start, end);
        final List<String> insights = generateInsights(summary, channelSplit);

        return new DashboardAnalyticsResponse(
            summary,
            channelSplit,
            topItemsByQuantity,
            topItemsByRevenue,
            topOutletsByRevenue,
            new ArrayList<>(), // Category split could be added if needed
            hourlyTrend,
            insights
        );
    }

    private SummaryStats getSummaryStats(final String outletId, final Instant start, final Instant end) {
        final Object[] result = (Object[]) em.createQuery(
            "SELECT COUNT(o), SUM(o.grandTotal) FROM Order o WHERE o.outletId = :outletId AND o.createdAt >= :start AND o.createdAt <= :end AND o.status != 'CANCELLED'")
            .setParameter("outletId", outletId)
            .setParameter("start", start)
            .setParameter("end", end)
            .getSingleResult();

        final long count = (Long) (result[0] != null ? result[0] : 0L);
        final BigDecimal revenue = (BigDecimal) (result[1] != null ? result[1] : BigDecimal.ZERO);
        final BigDecimal avg = count > 0 ? revenue.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        return new SummaryStats(count, revenue, avg, 0.0); // Growth rate needs previous period comparison
    }

    @SuppressWarnings("unchecked")
    private List<PerformanceMetric> getChannelSplit(final String outletId, final Instant start, final Instant end) {
        final List<Object[]> results = em.createQuery(
            "SELECT o.sourceChannel, COUNT(o), SUM(o.grandTotal) FROM Order o WHERE o.outletId = :outletId AND o.createdAt >= :start AND o.createdAt <= :end AND o.status != 'CANCELLED' GROUP BY o.sourceChannel")
            .setParameter("outletId", outletId)
            .setParameter("start", start)
            .setParameter("end", end)
            .getResultList();

        return results.stream()
            .map(r -> new PerformanceMetric(
                r[0] != null ? r[0].toString() : "Unknown", 
                asLong(r[1]), 
                asBigDecimal(r[2])))
            .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    private List<PerformanceMetric> getTopItemsByQuantity(final String outletId, final Instant start, final Instant end) {
        final List<Object[]> results = em.createQuery(
            "SELECT oi.itemName, SUM(oi.qty), SUM(oi.lineTotal) FROM OrderItem oi JOIN Order o ON oi.orderId = o.id WHERE o.outletId = :outletId AND o.createdAt >= :start AND o.createdAt <= :end AND o.status != 'CANCELLED' GROUP BY oi.itemName ORDER BY SUM(oi.qty) DESC")
            .setParameter("outletId", outletId)
            .setParameter("start", start)
            .setParameter("end", end)
            .setMaxResults(5)
            .getResultList();

        return results.stream()
            .map(r -> new PerformanceMetric(
                (String) r[0], 
                asLong(r[1]), 
                asBigDecimal(r[2])))
            .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    private List<PerformanceMetric> getTopItemsByRevenue(final String outletId, final Instant start, final Instant end) {
        final List<Object[]> results = em.createQuery(
            "SELECT oi.itemName, SUM(oi.qty), SUM(oi.lineTotal) FROM OrderItem oi JOIN Order o ON oi.orderId = o.id WHERE o.outletId = :outletId AND o.createdAt >= :start AND o.createdAt <= :end AND o.status != 'CANCELLED' GROUP BY oi.itemName ORDER BY SUM(oi.lineTotal) DESC")
            .setParameter("outletId", outletId)
            .setParameter("start", start)
            .setParameter("end", end)
            .setMaxResults(5)
            .getResultList();

        return results.stream()
            .map(r -> new PerformanceMetric(
                (String) r[0], 
                asLong(r[1]), 
                asBigDecimal(r[2])))
            .collect(Collectors.toList());
    }

    private List<PerformanceMetric> getTopOutletsByRevenue(final String outletId, final Instant start, final Instant end) {
        // 1. Fetch the current outlet to determine its tenant identifier
        final com.foodgrid.auth.model.Outlet outlet = em.find(com.foodgrid.auth.model.Outlet.class, outletId);
        if (outlet == null) return new ArrayList<>();

        final String clientId = outlet.clientId;
        final String ownerId = outlet.ownerId;

        // 2. Build query based on which identifier is available
        final String hql;
        final boolean useClientId = (clientId != null && !clientId.isBlank());
        
        if (useClientId) {
            hql = "SELECT ou.name, COUNT(o), SUM(o.grandTotal) FROM Order o JOIN Outlet ou ON o.outletId = ou.id " +
                  "WHERE ou.clientId = :clientId AND o.createdAt >= :start AND o.createdAt <= :end AND o.status != 'CANCELLED' " +
                  "GROUP BY ou.name, ou.id ORDER BY SUM(o.grandTotal) DESC";
        } else {
            hql = "SELECT ou.name, COUNT(o), SUM(o.grandTotal) FROM Order o JOIN Outlet ou ON o.outletId = ou.id " +
                  "WHERE ou.ownerId = :ownerId AND o.createdAt >= :start AND o.createdAt <= :end AND o.status != 'CANCELLED' " +
                  "GROUP BY ou.name, ou.id ORDER BY SUM(o.grandTotal) DESC";
        }

        final var query = em.createQuery(hql, Object[].class)
            .setParameter("start", start)
            .setParameter("end", end)
            .setMaxResults(5);
        
        if (useClientId) {
            query.setParameter("clientId", clientId);
        } else {
            query.setParameter("ownerId", ownerId);
        }

        final List<Object[]> results = query.getResultList();

        return results.stream()
            .map(r -> new PerformanceMetric(
                (String) r[0], 
                asLong(r[1]), 
                asBigDecimal(r[2])))
            .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    private List<DashboardAnalyticsResponse.HourlyData> getHourlyTrend(final String outletId, final Instant start, final Instant end) {
        final String nativeQuery = "SELECT HOUR(created_at) as hr, COUNT(*), SUM(grand_total) " +
                           "FROM orders " +
                           "WHERE outlet_id = :outletId AND created_at >= :start AND created_at <= :end AND status != 'CANCELLED' " +
                           "GROUP BY hr ORDER BY hr";
        
        final List<Object[]> results = em.createNativeQuery(nativeQuery)
            .setParameter("outletId", outletId)
            .setParameter("start", start)
            .setParameter("end", end)
            .getResultList();

        return results.stream()
            .map(r -> new DashboardAnalyticsResponse.HourlyData(
                r[0] != null ? ((Number) r[0]).intValue() : 0, 
                asLong(r[1]), 
                asBigDecimal(r[2])))
            .collect(Collectors.toList());
    }

    private BigDecimal asBigDecimal(final Object val) {
        if (val == null) return BigDecimal.ZERO;
        if (val instanceof BigDecimal) return (BigDecimal) val;
        return BigDecimal.valueOf(((Number) val).doubleValue());
    }

    private long asLong(final Object val) {
        if (val == null) return 0L;
        return ((Number) val).longValue();
    }

    private List<String> generateInsights(final SummaryStats summary, final List<PerformanceMetric> channelSplit) {
        final List<String> insights = new ArrayList<>();
        if (summary.totalOrders() > 0) {
            insights.add("Your Average Order Value (AOV) is " + summary.averageOrderValue() + ".");
        }
        
        channelSplit.stream()
            .max((a, b) -> a.revenue().compareTo(b.revenue()))
            .ifPresent(top -> insights.add(top.label() + " is your top performing channel, contributing " + top.revenue() + " in revenue."));
            
        return insights;
    }
}
