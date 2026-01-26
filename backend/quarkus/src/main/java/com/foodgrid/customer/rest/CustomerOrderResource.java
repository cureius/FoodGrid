
package com.foodgrid.customer.rest;

import com.foodgrid.pos.dto.*;
import com.foodgrid.customer.service.OrderCustomerService;
import com.foodgrid.payment.service.PaymentService;
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

    @Inject OrderCustomerService orderCustomerService;
    @Inject PaymentService paymentService;
    
    @Context SecurityContext securityContext;

    @POST
    @Operation(summary = "Create order", description = "Place a new order for the authenticated customer")
    public OrderResponse create(
        @Valid final OrderCreateRequest request, 
        @QueryParam("outletId") final String outletId,
        @QueryParam("customerId") final String customerId
    ) {
        // Enforce customer identity from context if customerId not provided
        final String actualCustomerId = customerId != null ? customerId : securityContext.getUserPrincipal().getName();
        
        return orderCustomerService.create(request, outletId, actualCustomerId);
    }

    @GET
    @Path("/{orderId}")
    @Operation(summary = "Get order", description = "Get details of a specific order owned by the customer")
    public OrderResponse get(@PathParam("orderId") final String orderId) {
        final String customerId = securityContext.getUserPrincipal().getName();
        return orderCustomerService.get(orderId, customerId);
    }

    @GET
    @Operation(summary = "List orders", description = "List recent orders placed by the authenticated customer")
    public List<OrderResponse> list(
        @QueryParam("limit") final Integer limit, 
        @QueryParam("outletId") final String outletId,
        @QueryParam("customerId") final String customerId
    ) {
        // Enforce customer identity from context if customerId not provided
        final String actualCustomerId = customerId != null ? customerId : securityContext.getUserPrincipal().getName();
        
        return orderCustomerService.listByCustomer(actualCustomerId, limit, outletId);
    }

    @POST
    @Path("/{orderId}/items")
    @Operation(summary = "Add item to order", description = "Add an item to an existing order")
    public OrderResponse addItem(
        @PathParam("orderId") final String orderId,
        @Valid final OrderAddItemRequest request
    ) {
        final String customerId = securityContext.getUserPrincipal().getName();
        return orderCustomerService.addItem(orderId, request, customerId);
    }

    @GET
    @Path("/{orderId}/items")
    @Operation(summary = "Get order items", description = "Get all items for a specific order owned by the customer")
    public List<OrderItemResponse> getItems(@PathParam("orderId") final String orderId) {
        final String customerId = securityContext.getUserPrincipal().getName();
        return orderCustomerService.getOrderItems(orderId, customerId);
    }

    @POST
    @Path("/{orderId}/payment-link")
    @Operation(summary = "Create payment link", description = "Create a payment link for the order")
    public com.foodgrid.payment.dto.PaymentLinkResponse createPaymentLink(
        @PathParam("orderId") final String orderId,
        @QueryParam("idempotencyKey") final String idempotencyKey
    ) {
        return paymentService.createPaymentLinkForCustomer(orderId, idempotencyKey);
    }

    @DELETE
    @Path("/{orderId}")
    @Operation(summary = "Cancel order", description = "Cancel an order if it hasn't been processed yet")
    public void cancel(@PathParam("orderId") final String orderId) {
        final String customerId = securityContext.getUserPrincipal().getName();
        orderCustomerService.cancel(orderId, customerId);
    }
}
