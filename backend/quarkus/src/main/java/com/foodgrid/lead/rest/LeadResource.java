package com.foodgrid.lead.rest;

import com.foodgrid.lead.model.Lead;
import com.foodgrid.lead.model.LeadStatus;
import com.foodgrid.lead.service.LeadService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/api/v1/internal/leads")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN", "TENANT_ADMIN"}) // Internal only
public class LeadResource {

    @Inject
    LeadService leadService;

    @GET
    public List<Lead> list(
            @QueryParam("status") LeadStatus status,
            @QueryParam("city") String city,
            @QueryParam("area") String area,
            @QueryParam("address") String address,
            @QueryParam("name") String name) {
        return leadService.list(status, city, area, address, name);
    }

    @GET
    @Path("/{id}")
    public Lead get(@PathParam("id") Long id) {
        return leadService.get(id);
    }

    @PATCH
    @Path("/{id}/status")
    public void updateStatus(@PathParam("id") Long id, @QueryParam("status") LeadStatus status) {
        leadService.updateStatus(id, status);
    }

    @POST
    @Path("/{id}/activities")
    public void addActivity(
            @PathParam("id") Long id,
            @QueryParam("channel") String channel,
            @QueryParam("outcome") String outcome,
            @QueryParam("performedBy") String performedBy) {
        leadService.addActivity(id, channel, outcome, performedBy);
    }

    @POST
    @Path("/discover")
    public boolean discover(
            @QueryParam("city") String city,
            @QueryParam("area") String area,
            @QueryParam("category") String category) {
        return leadService.triggerDiscovery(city, area, category);
    }

    @Inject
    com.foodgrid.lead.service.LeadNormalizationService normalizationService;

    @POST
    @Path("/normalize")
    public void normalize() {
        normalizationService.normalizeUnprocessedLeads();
    }

    @Inject
    com.foodgrid.lead.service.LeadEnrichmentService enrichmentService;

    @POST
    @Path("/enrich")
    public void enrich() {
        enrichmentService.enrichLeads();
    }

    @Inject
    com.foodgrid.lead.service.PitchService pitchService;

    @POST
    @Path("/{id}/pitch")
    public String generatePitch(@PathParam("id") Long id) {
        return pitchService.generatePitchLink(id);
    }
}
