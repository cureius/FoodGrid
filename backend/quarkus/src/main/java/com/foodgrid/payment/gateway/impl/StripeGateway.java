package com.foodgrid.payment.gateway.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodgrid.payment.dto.GatewayCredentials;
import com.foodgrid.payment.gateway.*;
import com.foodgrid.payment.model.PaymentGatewayType;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Stripe payment gateway implementation.
 * https://stripe.com/docs/api
 */
public class StripeGateway implements PaymentGateway {

    private static final String BASE_URL = "https://api.stripe.com/v1";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private GatewayCredentials credentials;
    private HttpClient httpClient;

    @Override
    public PaymentGatewayType getType() {
        return PaymentGatewayType.STRIPE;
    }

    @Override
    public void initialize(final GatewayCredentials credentials) {
        this.credentials = credentials;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
    }

    @Override
    public GatewayOrderResult createOrder(final String orderId, final BigDecimal amount, final String currency,
                                          final String receipt, final Map<String, String> notes) {
        try {
            // Stripe expects amount in cents/smallest currency unit
            final long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

            // Create a PaymentIntent
            final Map<String, String> params = new HashMap<>();
            params.put("amount", String.valueOf(amountInCents));
            params.put("currency", currency.toLowerCase());
            params.put("automatic_payment_methods[enabled]", "true");
            params.put("metadata[order_id]", orderId);
            if (receipt != null) {
                params.put("metadata[receipt]", receipt);
            }
            if (notes != null) {
                for (final Map.Entry<String, String> entry : notes.entrySet()) {
                    params.put("metadata[" + entry.getKey() + "]", entry.getValue());
                }
            }

            final String requestBody = params.entrySet().stream()
                .map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "=" +
                          URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));

            final HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/payment_intents"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("Authorization", "Bearer " + credentials.secretKey())
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            final HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                final JsonNode json = MAPPER.readTree(response.body());
                final String paymentIntentId = json.get("id").asText();
                final String clientSecret = json.get("client_secret").asText();

                // Client data for Stripe.js
                final Map<String, Object> clientData = new HashMap<>();
                clientData.put("clientSecret", clientSecret);
                clientData.put("publishableKey", credentials.apiKey());
                clientData.put("paymentIntentId", paymentIntentId);

                return GatewayOrderResult.success(paymentIntentId, clientData, response.body());
            } else {
                final JsonNode json = MAPPER.readTree(response.body());
                final String errorMsg = json.has("error") && json.get("error").has("message") ?
                    json.get("error").get("message").asText() : "PaymentIntent creation failed";
                return GatewayOrderResult.failure(errorMsg, response.body());
            }
        } catch (final Exception e) {
            return GatewayOrderResult.failure("Stripe API error: " + e.getMessage(), null);
        }
    }

    @Override
    public GatewayVerifyResult verifyPayment(final String gatewayOrderId, final String gatewayPaymentId,
                                             final String gatewaySignature, final Map<String, String> additionalData) {
        try {
            // For Stripe, gatewayOrderId is the PaymentIntent ID
            final HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/payment_intents/" + gatewayOrderId))
                .header("Authorization", "Bearer " + credentials.secretKey())
                .GET()
                .build();

            final HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                final JsonNode json = MAPPER.readTree(response.body());
                final String status = json.get("status").asText();
                final String chargeId = json.has("latest_charge") && !json.get("latest_charge").isNull() ?
                    json.get("latest_charge").asText() : null;

                // Get payment method type
                String paymentMethod = null;
                if (json.has("payment_method") && !json.get("payment_method").isNull()) {
                    paymentMethod = json.get("payment_method").asText();
                }

                if ("succeeded".equals(status)) {
                    return GatewayVerifyResult.success(chargeId != null ? chargeId : gatewayOrderId,
                                                        paymentMethod, response.body());
                } else if ("requires_capture".equals(status)) {
                    // Capture the payment
                    return capturePayment(gatewayOrderId);
                } else {
                    return GatewayVerifyResult.failure("Payment status: " + status, response.body());
                }
            } else {
                return GatewayVerifyResult.failure("Failed to fetch payment intent", response.body());
            }
        } catch (final Exception e) {
            return GatewayVerifyResult.failure("Verification error: " + e.getMessage(), null);
        }
    }

    private GatewayVerifyResult capturePayment(final String paymentIntentId) {
        try {
            final HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/payment_intents/" + paymentIntentId + "/capture"))
                .header("Authorization", "Bearer " + credentials.secretKey())
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();

            final HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                final JsonNode json = MAPPER.readTree(response.body());
                final String chargeId = json.has("latest_charge") && !json.get("latest_charge").isNull() ?
                    json.get("latest_charge").asText() : paymentIntentId;
                return GatewayVerifyResult.success(chargeId, null, response.body());
            } else {
                return GatewayVerifyResult.failure("Capture failed", response.body());
            }
        } catch (final Exception e) {
            return GatewayVerifyResult.failure("Capture error: " + e.getMessage(), null);
        }
    }

    @Override
    public GatewayRefundResult processRefund(final String gatewayPaymentId, final BigDecimal amount, final String reason) {
        try {
            final long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

            final Map<String, String> params = new HashMap<>();
            params.put("payment_intent", gatewayPaymentId);
            params.put("amount", String.valueOf(amountInCents));
            if (reason != null && !reason.isBlank()) {
                params.put("reason", "requested_by_customer");
                params.put("metadata[custom_reason]", reason);
            }

            final String requestBody = params.entrySet().stream()
                .map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "=" +
                          URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));

            final HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/refunds"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("Authorization", "Bearer " + credentials.secretKey())
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            final HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                final JsonNode json = MAPPER.readTree(response.body());
                final String refundId = json.get("id").asText();
                final String status = json.get("status").asText();

                if ("succeeded".equals(status)) {
                    return GatewayRefundResult.success(refundId, response.body());
                } else {
                    return GatewayRefundResult.processing(refundId, response.body());
                }
            } else {
                final JsonNode json = MAPPER.readTree(response.body());
                final String errorMsg = json.has("error") && json.get("error").has("message") ?
                    json.get("error").get("message").asText() : "Refund failed";
                return GatewayRefundResult.failure(errorMsg, response.body());
            }
        } catch (final Exception e) {
            return GatewayRefundResult.failure("Refund error: " + e.getMessage(), null);
        }
    }

    @Override
    public WebhookEvent parseWebhook(final String payload, final String signature) {
        try {
            final JsonNode json = MAPPER.readTree(payload);
            final String eventType = json.get("type").asText();
            final JsonNode dataObject = json.get("data").get("object");

            final String gatewayOrderId = dataObject.has("id") ? dataObject.get("id").asText() : null;
            final String gatewayPaymentId = dataObject.has("latest_charge") && !dataObject.get("latest_charge").isNull() ?
                dataObject.get("latest_charge").asText() : null;
            final String status = dataObject.has("status") ? dataObject.get("status").asText() : null;

            @SuppressWarnings("unchecked") final Map<String, Object> rawData = MAPPER.convertValue(json, Map.class);

            return new WebhookEvent(eventType, gatewayOrderId, gatewayPaymentId, status, null, rawData);
        } catch (final Exception e) {
            throw new RuntimeException("Failed to parse webhook: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean verifyWebhookSignature(final String payload, final String signature) {
        if (credentials.webhookSecret() == null || credentials.webhookSecret().isBlank()) {
            return true;
        }
        try {
            // Parse Stripe signature header: t=timestamp,v1=signature
            final String[] parts = signature.split(",");
            String timestamp = null;
            String v1Signature = null;
            for (final String part : parts) {
                final String[] keyValue = part.split("=", 2);
                if ("t".equals(keyValue[0])) timestamp = keyValue[1];
                if ("v1".equals(keyValue[0])) v1Signature = keyValue[1];
            }

            if (timestamp == null || v1Signature == null) {
                return false;
            }

            final String signedPayload = timestamp + "." + payload;
            final String expectedSignature = computeHmacSha256(signedPayload, credentials.webhookSecret());

            return expectedSignature.equals(v1Signature);
        } catch (final Exception e) {
            return false;
        }
    }

    @Override
    public String getPublicKey() {
        return credentials.apiKey(); // Stripe publishable key
    }

    private String computeHmacSha256(final String data, final String key) throws Exception {
        final Mac mac = Mac.getInstance("HmacSHA256");
        final SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKeySpec);
        final byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));

        final StringBuilder hexString = new StringBuilder();
        for (final byte b : hash) {
            final String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
