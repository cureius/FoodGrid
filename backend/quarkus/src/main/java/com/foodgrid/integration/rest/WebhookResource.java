package com.foodgrid.integration.rest;

import com.foodgrid.integration.model.SourceChannel;
import com.foodgrid.integration.service.ExternalOrderService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

@Path("/api/v1/webhooks/integrations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class WebhookResource {

    private static final Logger LOG = Logger.getLogger(WebhookResource.class);

    @Inject
    ExternalOrderService externalOrderService;

    @POST
    @Path("/swiggy")
    public Response handleSwiggyWebhook(@Context HttpHeaders headers, String payload) {
        LOG.info("Received Swiggy webhook: " + payload);
        // 1. Validate signature based on Swiggy tech docs
        // 2. Parse payload
        // 3. Map to ExternalOrderService.ExternalOrderPayload
        // 4. externalOrderService.ingestOrder(SourceChannel.SWIGGY, storeId, mappedPayload)
        return Response.ok().build();
    }

    @POST
    @Path("/zomato")
    public Response handleZomatoWebhook(@Context HttpHeaders headers, String payload) {
        LOG.info("Received Zomato webhook: " + payload);
        // Similar steps for Zomato
        return Response.ok().build();
    }
}
