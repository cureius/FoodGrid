package com.foodgrid.integration.rest;

import com.foodgrid.integration.model.ChannelIntegration;
import com.foodgrid.integration.model.SourceChannel;
import com.foodgrid.integration.repo.ChannelIntegrationRepository;
import com.foodgrid.integration.service.IntegrationService;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Path("/api/v1/outlets/{outlet_id}/integrations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class IntegrationResource {

    @Inject
    ChannelIntegrationRepository integrationRepository;

    @Inject
    IntegrationService integrationService;

    @GET
    public List<ChannelIntegration> getIntegrations(@PathParam("outlet_id") String outletId) {
        return integrationRepository.findByOutletId(outletId);
    }

    @POST
    @Path("/{channel}")
    @Transactional
    public ChannelIntegration saveIntegration(
            @PathParam("outlet_id") String outletId,
            @PathParam("channel") SourceChannel channel,
            ChannelIntegration request) {
        
        ChannelIntegration integration = integrationRepository.findByOutletIdAndChannel(outletId, channel)
                .orElse(new ChannelIntegration());
        
        if (integration.id == null) {
            integration.id = UUID.randomUUID().toString();
            integration.outletId = outletId;
            integration.channel = channel;
            integration.createdAt = Instant.now();
        }
        
        integration.externalStoreId = request.externalStoreId;
        integration.authPayload = request.authPayload;
        integration.isActive = request.isActive;
        integration.updatedAt = Instant.now();
        
        integrationRepository.persist(integration);
        return integration;
    }

    @POST
    @Path("/{channel}/test")
    public Response testConnection(
            @PathParam("outlet_id") String outletId,
            @PathParam("channel") SourceChannel channel) {
        integrationService.testConnection(outletId, channel);
        return Response.ok().build();
    }

    @POST
    @Path("/{channel}/sync-menu")
    public Response syncMenu(
            @PathParam("outlet_id") String outletId,
            @PathParam("channel") SourceChannel channel,
            @QueryParam("direction") @DefaultValue("PUSH") String direction) {
        if ("PUSH".equalsIgnoreCase(direction)) {
            integrationService.pushMenu(outletId, channel);
        } else {
            integrationService.pullMenu(outletId, channel);
        }
        return Response.accepted().build();
    }
}
