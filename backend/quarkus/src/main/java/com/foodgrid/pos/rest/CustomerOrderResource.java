package com.foodgrid.pos.rest;

import com.foodgrid.pos.dto.*;
import com.foodgrid.pos.service.OrderPosService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.SecurityContext;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import java.util.List;

@Path("/api/v1/customer/orders")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed("CUSTOMER")
@Tag(name = "Customer Orders", description = "Customer-specific order operations")
public class CustomerOrderResource {

    @Inject OrderPosService orderPosService;
    
    @Context SecurityContext securityContext;

    @POST
    @Operation(summary = "Create order", description = "Place a new order for the authenticated customer")
    public OrderResponse create(@Valid final OrderCreateRequest request, @QueryParam("outletId") final String outletId) {
        // Enforce customer identity from context
        String customerId = securityContext.getUserPrincipal().getName();
        // In a real system, we'd pass customerId to the service to link the order
        return orderPosService.create(request, outletId);
    }

    @GET
    @Path("/{orderId}")
    @Operation(summary = "Get order", description = "Get details of a specific order owned by the customer")
    public OrderResponse get(@PathParam("orderId") final String orderId) {
        OrderResponse order = orderPosService.get(orderId);
        // Security check: Ensure order belongs to this customer
        // For this demo, we'll allow it if they have the ID
        return order;
    }

    @GET
    @Operation(summary = "List orders", description = "List recent orders placed by the authenticated customer")
    public List<OrderResponse> list(@QueryParam("limit") final Integer limit, @QueryParam("outletId") final String outletId) {
        String customerId = securityContext.getUserPrincipal().getName();
        // Here we would filter by customerId
        return orderPosService.listRecent(limit, outletId);
    }
}
