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
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Razorpay payment gateway implementation.
 * https://razorpay.com/docs/api/
 */
public class RazorpayGateway implements PaymentGateway {

    private static final String BASE_URL = "https://api.razorpay.com/v1";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private GatewayCredentials credentials;
    private HttpClient httpClient;

    @Override
    public PaymentGatewayType getType() {
        return PaymentGatewayType.RAZORPAY;
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
            // Razorpay expects amount in paise (smallest currency unit)
            final long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();

            final Map<String, Object> orderRequest = new HashMap<>();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", currency);
            orderRequest.put("receipt", receipt != null ? receipt : orderId);
            if (notes != null && !notes.isEmpty()) {
                orderRequest.put("notes", notes);
            }

            final String requestBody = MAPPER.writeValueAsString(orderRequest);

            final HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/orders"))
                .header("Content-Type", "application/json")
                .header("Authorization", getBasicAuth())
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            final HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                final JsonNode json = MAPPER.readTree(response.body());
                final String gatewayOrderId = json.get("id").asText();

                // Client data needed for Razorpay checkout
                final Map<String, Object> clientData = new HashMap<>();
                clientData.put("key", credentials.apiKey());
                clientData.put("order_id", gatewayOrderId);
                clientData.put("amount", amountInPaise);
                clientData.put("currency", currency);
                clientData.put("name", "FoodGrid");

                return GatewayOrderResult.success(gatewayOrderId, clientData, response.body());
            } else {
                final JsonNode json = MAPPER.readTree(response.body());
                final String errorMsg = json.has("error") ?
                    json.get("error").get("description").asText() : "Order creation failed";
                return GatewayOrderResult.failure(errorMsg, response.body());
            }
        } catch (final Exception e) {
            return GatewayOrderResult.failure("Razorpay API error: " + e.getMessage(), null);
        }
    }

    @Override
    public GatewayVerifyResult verifyPayment(final String gatewayOrderId, final String gatewayPaymentId,
                                             final String gatewaySignature, final Map<String, String> additionalData) {
        try {
            // Verify signature: HMAC_SHA256(order_id + "|" + payment_id, secret)
            final String payload = gatewayOrderId + "|" + gatewayPaymentId;
            final String expectedSignature = generateHmacSha256(payload, credentials.secretKey());

            if (!expectedSignature.equals(gatewaySignature)) {
                return GatewayVerifyResult.failure("Invalid signature", null);
            }

            // Fetch payment details to confirm status
            final HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/payments/" + gatewayPaymentId))
                .header("Authorization", getBasicAuth())
                .GET()
                .build();

            final HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                final JsonNode json = MAPPER.readTree(response.body());
                final String status = json.get("status").asText();
                final String method = json.has("method") ? json.get("method").asText() : null;

                if ("captured".equals(status)) {
                    return GatewayVerifyResult.success(gatewayPaymentId, method, response.body());
                } else if ("authorized".equals(status)) {
                    // Auto-capture if not already captured
                    return capturePayment(gatewayPaymentId, json.get("amount").asLong());
                } else {
                    return GatewayVerifyResult.failure("Payment status: " + status, response.body());
                }
            } else {
                return GatewayVerifyResult.failure("Failed to fetch payment details", response.body());
            }
        } catch (final Exception e) {
            return GatewayVerifyResult.failure("Verification error: " + e.getMessage(), null);
        }
    }

    private GatewayVerifyResult capturePayment(final String paymentId, final long amount) {
        try {
            final Map<String, Object> captureRequest = new HashMap<>();
            captureRequest.put("amount", amount);
            captureRequest.put("currency", "INR");

            final String requestBody = MAPPER.writeValueAsString(captureRequest);

            final HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/payments/" + paymentId + "/capture"))
                .header("Content-Type", "application/json")
                .header("Authorization", getBasicAuth())
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            final HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                final JsonNode json = MAPPER.readTree(response.body());
                final String method = json.has("method") ? json.get("method").asText() : null;
                return GatewayVerifyResult.success(paymentId, method, response.body());
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
            final long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();

            final Map<String, Object> refundRequest = new HashMap<>();
            refundRequest.put("amount", amountInPaise);
            if (reason != null && !reason.isBlank()) {
                final Map<String, String> notes = new HashMap<>();
                notes.put("reason", reason);
                refundRequest.put("notes", notes);
            }

            final String requestBody = MAPPER.writeValueAsString(refundRequest);

            final HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/payments/" + gatewayPaymentId + "/refund"))
                .header("Content-Type", "application/json")
                .header("Authorization", getBasicAuth())
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            final HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                final JsonNode json = MAPPER.readTree(response.body());
                final String refundId = json.get("id").asText();
                final String status = json.get("status").asText();

                if ("processed".equals(status)) {
                    return GatewayRefundResult.success(refundId, response.body());
                } else {
                    return GatewayRefundResult.processing(refundId, response.body());
                }
            } else {
                final JsonNode json = MAPPER.readTree(response.body());
                final String errorMsg = json.has("error") ?
                    json.get("error").get("description").asText() : "Refund failed";
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
            final String eventType = json.get("event").asText();

            final JsonNode payloadNode = json.get("payload");
            final JsonNode paymentNode = payloadNode.has("payment") ?
                payloadNode.get("payment").get("entity") : null;

            final String gatewayOrderId = paymentNode != null && paymentNode.has("order_id") ?
                paymentNode.get("order_id").asText() : null;
            final String gatewayPaymentId = paymentNode != null && paymentNode.has("id") ?
                paymentNode.get("id").asText() : null;
            final String status = paymentNode != null && paymentNode.has("status") ?
                paymentNode.get("status").asText() : null;
            final String method = paymentNode != null && paymentNode.has("method") ?
                paymentNode.get("method").asText() : null;

            @SuppressWarnings("unchecked") final Map<String, Object> rawData = MAPPER.convertValue(json, Map.class);

            return new WebhookEvent(eventType, gatewayOrderId, gatewayPaymentId, status, method, rawData);
        } catch (final Exception e) {
            throw new RuntimeException("Failed to parse webhook: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean verifyWebhookSignature(final String payload, final String signature) {
        if (credentials.webhookSecret() == null || credentials.webhookSecret().isBlank()) {
            return true; // Skip verification if no webhook secret configured
        }
        try {
            final String expectedSignature = generateHmacSha256(payload, credentials.webhookSecret());
            return expectedSignature.equals(signature);
        } catch (final Exception e) {
            return false;
        }
    }

    @Override
    public String getPublicKey() {
        return credentials.apiKey(); // Razorpay uses key_id as public key
    }

    private String getBasicAuth() {
        final String auth = credentials.apiKey() + ":" + credentials.secretKey();
        return "Basic " + Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
    }

    private String generateHmacSha256(final String data, final String key) throws Exception {
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
