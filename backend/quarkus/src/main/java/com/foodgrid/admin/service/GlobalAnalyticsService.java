package com.foodgrid.admin.service;

import com.foodgrid.admin.dto.analytics.GlobalAnalyticsResponse;
import com.foodgrid.admin.dto.ClientResponse;
import com.foodgrid.admin.repo.AdminUserRepository;
import com.foodgrid.admin.repo.ClientRepository;
import com.foodgrid.auth.repo.OutletRepository;
import com.foodgrid.pos.repo.OrderRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class GlobalAnalyticsService {

    @Inject ClientRepository clientRepository;
    @Inject AdminUserRepository adminUserRepository;
    @Inject OutletRepository outletRepository;
    @Inject OrderRepository orderRepository;
    @Inject TenantAdminService tenantAdminService;

    public GlobalAnalyticsResponse getGlobalStats() {
        long totalTenants = clientRepository.count();
        long activeTenants = clientRepository.count("status", com.foodgrid.admin.model.Client.Status.ACTIVE);
        long totalUsers = adminUserRepository.count();
        long totalOutlets = outletRepository.count();
        
        // Sum total revenue from all orders
        double totalRevenue = orderRepository.listAll().stream()
                .map(o -> o.grandTotal)
                .filter(java.util.Objects::nonNull)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();

        // Get 5 most recent tenants
        List<ClientResponse> recentTenants = clientRepository.list("order by createdAt desc").stream()
                .limit(5)
                .map(tenantAdminService::toResponse)
                .collect(Collectors.toList());

        // Placeholder for revenue by month (requires more complex query/service)
        List<GlobalAnalyticsResponse.RevenueMetric> revenueByMonth = List.of(
            new GlobalAnalyticsResponse.RevenueMetric("Jan", 12000),
            new GlobalAnalyticsResponse.RevenueMetric("Feb", 15000)
        );

        return new GlobalAnalyticsResponse(
            totalTenants,
            activeTenants,
            totalUsers,
            totalOutlets,
            totalRevenue,
            activeTenants, // Placeholder for subscriptions
            recentTenants,
            revenueByMonth
        );
    }
}
