package com.foodgrid.admin.rest;

import com.foodgrid.admin.dto.analytics.GlobalAnalyticsResponse;
import com.foodgrid.admin.service.GlobalAnalyticsService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/api/v1/admin/global-analytics")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN", "TENANT_ADMIN"})
@Tag(name = "Platform Analytics", description = "Global metrics for the entire platform")
public class GlobalAnalyticsResource {

    @Inject GlobalAnalyticsService globalAnalyticsService;

    @GET
    @Operation(summary = "Get global stats", description = "Get platform-wide aggregated statistics")
    public GlobalAnalyticsResponse getGlobalStats() {
        return globalAnalyticsService.getGlobalStats();
    }
}
