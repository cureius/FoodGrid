package com.foodgrid.customer.rest;

import com.foodgrid.payment.dto.*;
import com.foodgrid.payment.service.PaymentService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/api/v1/customer/payments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Customer Payments", description = "Customer-specific payment operations")
public class CustomerPaymentResource {

    @Inject
    PaymentService paymentService;

    @POST
    @Path("/order/{orderId}/link")
    @RolesAllowed("CUSTOMER")
    @Operation(summary = "Create payment link", description = "Create a payment link for a customer order")
    public Response createPaymentLink(
            @PathParam("orderId") final String orderId,
            @HeaderParam("Idempotency-Key") final String idempotencyKey) {
        // For customer requests, we might not have clientId/outletId in JWT, 
        // handle resolution or assume defaults/link to order
        final PaymentLinkResponse response = paymentService.createPaymentLinkForCustomer(orderId, idempotencyKey);
        return Response.ok(response).build();
    }

    @GET
    @Path("/order/{orderId}")
    @RolesAllowed("CUSTOMER")
    @Operation(summary = "Get payment info", description = "Get payment details for a customer order")
    public Response getOrderPayment(@PathParam("orderId") final String orderId) {
        final GatewayTransactionResponse tx = paymentService.getTransactionByOrderId(orderId);
        return Response.ok(tx).build();
    }

    @GET
    @Path("/order/{orderId}/status")
    @Operation(summary = "Get payment status", description = "Get status of a payment (Publicly accessible for polling)")
    public Response getPaymentStatus(@PathParam("orderId") final String orderId) {
        final PaymentStatusResponse response = paymentService.getPaymentStatus(orderId);
        return Response.ok(response).build();
    }
}
