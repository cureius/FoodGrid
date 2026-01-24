package com.foodgrid.payment.rest;

import com.foodgrid.common.security.TenantGuards;
import com.foodgrid.payment.dto.*;
import com.foodgrid.payment.service.PaymentService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

/**
 * REST resource for payment operations.
 * Used by POS and customer-facing applications.
 */
@Path("/api/v1/payments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Payments", description = "Payment gateway operations")
public class PaymentResource {

    @Inject
    PaymentService paymentService;

    @Inject
    TenantGuards tenantGuards;

    @Inject
    JsonWebToken jwt;

    @POST
    @Path("/initiate")
    @RolesAllowed({"POS_USER", "ADMIN", "CLIENT_ADMIN"})
    @Operation(summary = "Initiate a payment", description = "Create a payment order with the configured gateway")
    public Response initiatePayment(@Valid final InitiatePaymentRequest request) {
        final String tenantId = tenantGuards.requireTenant();
        final String clientId = jwt.getClaim("clientId");
        final String outletId = jwt.getClaim("outletId");

        final InitiatePaymentResponse response = paymentService.initiatePayment(tenantId, clientId, outletId, request);
        return Response.ok(response).build();
    }

    @POST
    @Path("/verify")
    @RolesAllowed({"POS_USER", "ADMIN", "CLIENT_ADMIN"})
    @Operation(summary = "Verify a payment", description = "Verify and capture a payment after client-side completion")
    public Response verifyPayment(@Valid final VerifyPaymentRequest request) {
        final String clientId = jwt.getClaim("clientId");
        final GatewayTransactionResponse response = paymentService.verifyPayment(clientId, request);
        return Response.ok(response).build();
    }

    @POST
    @Path("/refund")
    @RolesAllowed({"ADMIN", "CLIENT_ADMIN"})
    @Operation(summary = "Process a refund", description = "Initiate a refund for a captured payment")
    public Response processRefund(@Valid final RefundRequest request) {
        final String clientId = jwt.getClaim("clientId");
        final RefundResponse response = paymentService.processRefund(clientId, request);
        return Response.ok(response).build();
    }

    @GET
    @Path("/{transactionId}")
    @RolesAllowed({"POS_USER", "ADMIN", "CLIENT_ADMIN"})
    @Operation(summary = "Get transaction", description = "Get transaction details by ID")
    public Response getTransaction(@PathParam("transactionId") final String transactionId) {
        final GatewayTransactionResponse response = paymentService.getTransaction(transactionId);
        return Response.ok(response).build();
    }

    @GET
    @Path("/order/{orderId}")
    @RolesAllowed({"POS_USER", "ADMIN", "CLIENT_ADMIN"})
    @Operation(summary = "Get transaction by order", description = "Get transaction details by order ID")
    public Response getTransactionByOrder(@PathParam("orderId") final String orderId) {
        final GatewayTransactionResponse response = paymentService.getTransactionByOrderId(orderId);
        return Response.ok(response).build();
    }

    @GET
    @RolesAllowed({"POS_USER", "ADMIN", "CLIENT_ADMIN"})
    @Operation(summary = "List transactions", description = "List recent transactions for the outlet")
    public Response listTransactions(@QueryParam("limit") @DefaultValue("50") final int limit) {
        final String outletId = jwt.getClaim("outletId");
        final List<GatewayTransactionResponse> transactions = paymentService.listTransactions(outletId, limit);
        return Response.ok(transactions).build();
    }

    @GET
    @Path("/{transactionId}/refunds")
    @RolesAllowed({"ADMIN", "CLIENT_ADMIN"})
    @Operation(summary = "List refunds", description = "List refunds for a transaction")
    public Response listRefunds(@PathParam("transactionId") final String transactionId) {
        final List<RefundResponse> refunds = paymentService.listRefunds(transactionId);
        return Response.ok(refunds).build();
    }

    @POST
    @Path("/order/{orderId}/link")
    @RolesAllowed({"POS_USER", "ADMIN", "CLIENT_ADMIN"})
    @Operation(summary = "Create payment link", description = "Create a payment link for an order that has been billed")
    public Response createPaymentLink(
            @PathParam("orderId") final String orderId,
            @HeaderParam("Idempotency-Key") final String idempotencyKey) {
        final String tenantId = tenantGuards.requireTenant();
        final String clientId = jwt.getClaim("clientId");
        final String outletId = jwt.getClaim("outletId");

        final PaymentLinkResponse response = paymentService.createPaymentLink(
            tenantId, clientId, outletId, orderId, idempotencyKey);
        return Response.ok(response).build();
    }

    @GET
    @Path("/order/{orderId}/status")
    @RolesAllowed({"POS_USER", "ADMIN", "CLIENT_ADMIN"})
    @Operation(summary = "Get payment status", description = "Get payment status for an order (for UI polling)")
    public Response getPaymentStatus(@PathParam("orderId") final String orderId) {
        final PaymentStatusResponse response = paymentService.getPaymentStatus(orderId);
        return Response.ok(response).build();
    }
}
