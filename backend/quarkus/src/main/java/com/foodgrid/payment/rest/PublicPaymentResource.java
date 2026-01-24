package com.foodgrid.payment.rest;

import com.foodgrid.payment.dto.*;
import com.foodgrid.payment.model.PaymentGatewayType;
import com.foodgrid.payment.service.PaymentService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

/**
 * Public REST resource for customer-facing payment operations.
 * These endpoints can be used by customers to pay for their orders
 * (e.g., via QR code scanned at the table).
 */
@Path("/api/v1/public/payments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Public Payments", description = "Customer-facing payment operations")
public class PublicPaymentResource {

    @Inject
    PaymentService paymentService;

    /**
     * Get payment details for an order.
     * Called when customer scans QR code to view their bill and pay.
     */
    @GET
    @Path("/order/{orderId}")
    @Operation(summary = "Get order payment info", description = "Get payment information for an order")
    public Response getOrderPayment(@PathParam("orderId") final String orderId) {
        try {
            final GatewayTransactionResponse tx = paymentService.getTransactionByOrderId(orderId);
            return Response.ok(tx).build();
        } catch (final NotFoundException e) {
            // Order exists but no payment initiated yet
            return Response.status(Response.Status.NOT_FOUND)
                .entity(new ErrorResponse("NO_PAYMENT", "No payment initiated for this order"))
                .build();
        }
    }

    /**
     * Get payment status for an order (public endpoint for customer UI polling).
     */
    @GET
    @Path("/order/{orderId}/status")
    @Operation(summary = "Get payment status", description = "Get payment status for an order (for UI polling)")
    public Response getPaymentStatus(@PathParam("orderId") final String orderId) {
        try {
            final PaymentStatusResponse response = paymentService.getPaymentStatus(orderId);
            return Response.ok(response).build();
        } catch (final NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(new ErrorResponse("ORDER_NOT_FOUND", "Order not found"))
                .build();
        }
    }

    /**
     * Verify a payment (public endpoint for client-side SDK callback).
     * This allows the payment SDK to verify the payment without authentication.
     */
    @POST
    @Path("/verify")
    @Operation(summary = "Verify payment", description = "Verify a payment after client-side completion")
    public Response verifyPayment(@Valid final PublicVerifyRequest request) {
        try {
            final VerifyPaymentRequest verifyReq = new VerifyPaymentRequest(
                request.transactionId(),
                request.gatewayPaymentId(),
                request.gatewaySignature(),
                request.gatewayOrderId(),
                request.additionalData()
            );

            // Use public verify which gets clientId from transaction
            final GatewayTransactionResponse tx = paymentService.verifyPaymentPublic(verifyReq);

            return Response.ok(new PublicVerifyResponse(
                tx.id(), tx.orderId(), tx.status().name(),
                tx.paymentMethod(), tx.status().name().equals("CAPTURED")
            )).build();
        } catch (final Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(new ErrorResponse("VERIFY_FAILED", e.getMessage()))
                .build();
        }
    }

    /**
     * Get supported payment methods for a specific gateway.
     */
    @GET
    @Path("/methods/{gatewayType}")
    @Operation(summary = "Get payment methods", description = "Get available payment methods for a gateway")
    public Response getPaymentMethods(@PathParam("gatewayType") final PaymentGatewayType gatewayType) {
        // Return common payment methods per gateway
        final var methods = switch (gatewayType) {
            case RAZORPAY -> new PaymentMethods(
                true, true, true, true, true, // card, upi, netbanking, wallet, emi
                new String[]{"credit_card", "debit_card", "upi", "netbanking", "wallet", "emi"}
            );
            case STRIPE -> new PaymentMethods(
                true, false, false, true, false,
                new String[]{"card", "apple_pay", "google_pay"}
            );
            case PAYU -> new PaymentMethods(
                true, true, true, true, true,
                new String[]{"CC", "DC", "NB", "UPI", "WALLET", "EMI"}
            );
            case PHONEPE, CASHFREE -> new PaymentMethods(
                true, true, true, true, false,
                new String[]{"card", "upi", "netbanking", "wallet"}
            );
            case BHARATPAY -> new PaymentMethods(
                true, true, true, true, true,
                new String[]{"credit_card", "debit_card", "upi", "netbanking", "wallet", "emi"}
            );
        };
        return Response.ok(methods).build();
    }

    record ErrorResponse(String code, String message) {}

    record PublicVerifyRequest(
        String transactionId,
        String gatewayPaymentId,
        String gatewaySignature,
        String gatewayOrderId,
        java.util.Map<String, String> additionalData
    ) {}

    record PublicVerifyResponse(
        String transactionId,
        String orderId,
        String status,
        String paymentMethod,
        boolean success
    ) {}

    record PaymentMethods(
        boolean cardEnabled,
        boolean upiEnabled,
        boolean netbankingEnabled,
        boolean walletEnabled,
        boolean emiEnabled,
        String[] methods
    ) {}
}
