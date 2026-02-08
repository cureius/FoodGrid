package com.foodgrid.admin.rest;

import com.foodgrid.admin.dto.analytics.DashboardAnalyticsResponse;
import com.foodgrid.admin.service.DashboardAnalyticsService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.time.Instant;

@Path("/api/v1/admin/analytics")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN"})
public class DashboardAnalyticsResource {

    @Inject DashboardAnalyticsService analyticsService;

    @GET
    public DashboardAnalyticsResponse getAnalytics(
            @QueryParam("outletId") String outletId,
            @QueryParam("start") String startStr,
            @QueryParam("end") String endStr) {
        
        if (outletId == null || outletId.isBlank()) {
            throw new BadRequestException("outletId is required");
        }

        Instant start = (startStr != null) ? Instant.parse(startStr) : Instant.now().minus(java.time.Duration.ofDays(7));
        Instant end = (endStr != null) ? Instant.parse(endStr) : Instant.now();

        return analyticsService.getAnalytics(outletId, start, end);
    }
}
