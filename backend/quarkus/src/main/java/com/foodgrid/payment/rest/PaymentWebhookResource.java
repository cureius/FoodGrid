package com.foodgrid.payment.rest;

import com.foodgrid.payment.model.PaymentGatewayType;
import com.foodgrid.payment.service.PaymentService;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

/**
 * REST resource for receiving payment gateway webhooks.
 * These endpoints are publicly accessible (no auth) as they're called by payment gateways.
 */
@Path("/api/v1/webhooks/payment")
@Tag(name = "Payment Webhooks", description = "Payment gateway webhook endpoints")
public class PaymentWebhookResource {

    private static final Logger LOG = Logger.getLogger(PaymentWebhookResource.class);

    @Inject
    PaymentService paymentService;

    @GET
    @Path("/razorpay")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @PermitAll
    @Operation(summary = "Razorpay webhook", description = "Receive webhooks from Razorpay")
    public Response razorpayWebhook(
            @QueryParam("razorpay_payment_id") final String razorpayPaymentId,
            @QueryParam("razorpay_payment_link_id") final String razorpayPaymentLinkId,
            @QueryParam("razorpay_payment_link_reference_id") final String razorpayPaymentLinkReferenceId,
            @QueryParam("razorpay_payment_link_status") final String razorpayPaymentLinkStatus,
            @QueryParam("razorpay_signature") final String signature) {
        LOG.infof("Received Razorpay webhook, signature present: %s", signature != null);
        LOG.infof("Payment ID: %s, Link ID: %s, Reference ID: %s, Status: %s",
                razorpayPaymentId, razorpayPaymentLinkId, razorpayPaymentLinkReferenceId, razorpayPaymentLinkStatus);

        try {
            final String payload = "{ \"razorpay_payment_id\": \"" + razorpayPaymentId + "\", \"razorpay_payment_link_id\": \"" + razorpayPaymentLinkId + "\", \"razorpay_payment_link_reference_id\": \"" + razorpayPaymentLinkReferenceId + "\", \"razorpay_payment_link_status\": \"" + razorpayPaymentLinkStatus + "\"}";

            paymentService.processWebhook(PaymentGatewayType.RAZORPAY, payload, signature);

            LOG.infof("Webhook processed successfully");
            return Response.ok().build();
        } catch (final Exception e) {
            LOG.errorf(e, "Error processing Razorpay webhook");
            // Return 200 to prevent retries - we've logged and stored the event
            return Response.ok().build();
        }
    }

    @POST
    @Path("/stripe")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @PermitAll
    @Operation(summary = "Stripe webhook", description = "Receive webhooks from Stripe")
    public Response stripeWebhook(
            @HeaderParam("Stripe-Signature") final String signature,
            final String payload) {
        LOG.infof("Received Stripe webhook, signature present: %s", signature != null);
        try {
            paymentService.processWebhook(PaymentGatewayType.STRIPE, payload, signature);
            return Response.ok().build();
        } catch (final Exception e) {
            LOG.errorf(e, "Error processing Stripe webhook");
            return Response.ok().build();
        }
    }

    @POST
    @Path("/payu")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces(MediaType.APPLICATION_JSON)
    @PermitAll
    @Operation(summary = "PayU webhook/callback", description = "Receive callbacks from PayU")
    public Response payuWebhook(final String payload) {
        LOG.infof("Received PayU callback");
        try {
            paymentService.processWebhook(PaymentGatewayType.PAYU, payload, null);
            return Response.ok().build();
        } catch (final Exception e) {
            LOG.errorf(e, "Error processing PayU webhook");
            return Response.ok().build();
        }
    }

    @POST
    @Path("/phonepe")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @PermitAll
    @Operation(summary = "PhonePe webhook", description = "Receive webhooks from PhonePe")
    public Response phonePeWebhook(
            @HeaderParam("X-VERIFY") final String signature,
            final String payload) {
        LOG.infof("Received PhonePe webhook");
        try {
            paymentService.processWebhook(PaymentGatewayType.PHONEPE, payload, signature);
            return Response.ok().build();
        } catch (final Exception e) {
            LOG.errorf(e, "Error processing PhonePe webhook");
            return Response.ok().build();
        }
    }

    @POST
    @Path("/cashfree")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @PermitAll
    @Operation(summary = "Cashfree webhook", description = "Receive webhooks from Cashfree")
    public Response cashfreeWebhook(
            @HeaderParam("x-webhook-signature") final String signature,
            @HeaderParam("x-webhook-timestamp") final String timestamp,
            final String payload) {
        LOG.infof("Received Cashfree webhook");
        try {
            // Include timestamp in signature verification
            final String fullSignature = timestamp + ":" + signature;
            paymentService.processWebhook(PaymentGatewayType.CASHFREE, payload, fullSignature);
            return Response.ok().build();
        } catch (final Exception e) {
            LOG.errorf(e, "Error processing Cashfree webhook");
            return Response.ok().build();
        }
    }

    @POST
    @Path("/bharatpay")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @PermitAll
    @Operation(summary = "BharatPay webhook", description = "Receive webhooks from BharatPay")
    public Response bharatPayWebhook(
            @HeaderParam("X-BharatPay-Signature") final String signature,
            final String payload) {
        LOG.infof("Received BharatPay webhook, signature present: %s", signature != null);
        try {
            paymentService.processWebhook(PaymentGatewayType.BHARATPAY, payload, signature);
            return Response.ok().build();
        } catch (final Exception e) {
            LOG.errorf(e, "Error processing BharatPay webhook");
            return Response.ok().build();
        }
    }
}
