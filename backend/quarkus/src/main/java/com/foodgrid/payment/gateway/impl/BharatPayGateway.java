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
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

/**
 * BharatPay payment gateway implementation.
 * BharatPay is an Indian payment gateway supporting UPI, cards, net banking, and wallets.
 *
 * API Documentation: https://docs.bharatpay.co.in/
 *
 * Required credentials:
 * - apiKey: Merchant API Key
 * - secretKey: Merchant Secret Key (for signature generation)
 * - merchantId: Merchant ID provided by BharatPay
 */
public class BharatPayGateway implements PaymentGateway {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private GatewayCredentials credentials;
    private HttpClient httpClient;
    private String baseUrl;

    @Override
    public PaymentGatewayType getType() {
        return PaymentGatewayType.BHARATPAY;
    }

    @Override
    public void initialize(final GatewayCredentials credentials) {
        this.credentials = credentials;
        this.baseUrl = credentials.getBaseUrl();
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
    }

    @Override
    public GatewayOrderResult createOrder(final String orderId, final BigDecimal amount, final String currency,
                                          final String receipt, final Map<String, String> notes) {
        try {
            // BharatPay expects amount in paise (smallest currency unit for INR)
            final long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();
            final String timestamp = String.valueOf(Instant.now().getEpochSecond());

            final Map<String, Object> orderRequest = new TreeMap<>();
            orderRequest.put("merchant_id", credentials.merchantId());
            orderRequest.put("order_id", orderId);
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", currency != null ? currency : "INR");
            orderRequest.put("receipt", receipt != null ? receipt : orderId);
            orderRequest.put("timestamp", timestamp);

            // Add optional notes/metadata
            if (notes != null && !notes.isEmpty()) {
                orderRequest.put("notes", notes);
            }

            // Generate signature for request authentication
            final String signature = generateSignature(orderRequest);
            orderRequest.put("signature", signature);

            final String requestBody = MAPPER.writeValueAsString(orderRequest);

            final HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/orders/create"))
                .header("Content-Type", "application/json")
                .header("X-Api-Key", credentials.apiKey())
                .header("X-Merchant-Id", credentials.merchantId())
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            final HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                final JsonNode json = MAPPER.readTree(response.body());

                if (json.has("success") && json.get("success").asBoolean()) {
                    final JsonNode data = json.get("data");
                    final String gatewayOrderId = data.get("order_id").asText();
                    final String paymentLink = data.has("payment_link") ? data.get("payment_link").asText() : null;

                    // Client data needed for BharatPay checkout
                    final Map<String, Object> clientData = new HashMap<>();
                    clientData.put("merchant_id", credentials.merchantId());
                    clientData.put("order_id", gatewayOrderId);
                    clientData.put("amount", amountInPaise);
                    clientData.put("currency", currency != null ? currency : "INR");
                    clientData.put("api_key", credentials.apiKey());
                    if (paymentLink != null) {
                        clientData.put("payment_link", paymentLink);
                    }

                    return GatewayOrderResult.success(gatewayOrderId, clientData, response.body());
                } else {
                    final String errorMsg = json.has("message") ? json.get("message").asText() : "Order creation failed";
                    return GatewayOrderResult.failure(errorMsg, response.body());
                }
            } else {
                final JsonNode json = MAPPER.readTree(response.body());
                final String errorMsg = json.has("message") ? json.get("message").asText() : "Order creation failed";
                return GatewayOrderResult.failure(errorMsg, response.body());
            }
        } catch (final Exception e) {
            return GatewayOrderResult.failure("BharatPay API error: " + e.getMessage(), null);
        }
    }

    @Override
    public GatewayVerifyResult verifyPayment(final String gatewayOrderId, final String gatewayPaymentId,
                                             final String gatewaySignature, final Map<String, String> additionalData) {
        try {
            // Verify signature from callback/webhook
            final Map<String, Object> verifyData = new TreeMap<>();
            verifyData.put("order_id", gatewayOrderId);
            verifyData.put("payment_id", gatewayPaymentId);

            final String expectedSignature = generateSignature(verifyData);

            if (!expectedSignature.equals(gatewaySignature)) {
                return GatewayVerifyResult.failure("Invalid signature", null);
            }

            // Fetch payment status from BharatPay
            final HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/payments/" + gatewayPaymentId + "/status"))
                .header("X-Api-Key", credentials.apiKey())
                .header("X-Merchant-Id", credentials.merchantId())
                .GET()
                .build();

            final HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                final JsonNode json = MAPPER.readTree(response.body());

                if (json.has("success") && json.get("success").asBoolean()) {
                    final JsonNode data = json.get("data");
                    final String status = data.get("status").asText();
                    final String paymentMethod = data.has("payment_method") ? data.get("payment_method").asText() : null;

                    if ("SUCCESS".equalsIgnoreCase(status) || "CAPTURED".equalsIgnoreCase(status)) {
                        return GatewayVerifyResult.success(gatewayPaymentId, paymentMethod, response.body());
                    } else if ("PENDING".equalsIgnoreCase(status)) {
                        return GatewayVerifyResult.failure("Payment pending", response.body());
                    } else {
                        return GatewayVerifyResult.failure("Payment status: " + status, response.body());
                    }
                } else {
                    final String errorMsg = json.has("message") ? json.get("message").asText() : "Verification failed";
                    return GatewayVerifyResult.failure(errorMsg, response.body());
                }
            } else {
                return GatewayVerifyResult.failure("Failed to fetch payment details", response.body());
            }
        } catch (final Exception e) {
            return GatewayVerifyResult.failure("Verification error: " + e.getMessage(), null);
        }
    }

    @Override
    public GatewayRefundResult processRefund(final String gatewayPaymentId, final BigDecimal amount, final String reason) {
        try {
            final long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();
            final String timestamp = String.valueOf(Instant.now().getEpochSecond());

            final Map<String, Object> refundRequest = new TreeMap<>();
            refundRequest.put("merchant_id", credentials.merchantId());
            refundRequest.put("payment_id", gatewayPaymentId);
            refundRequest.put("amount", amountInPaise);
            refundRequest.put("timestamp", timestamp);
            if (reason != null && !reason.isBlank()) {
                refundRequest.put("reason", reason);
            }

            final String signature = generateSignature(refundRequest);
            refundRequest.put("signature", signature);

            final String requestBody = MAPPER.writeValueAsString(refundRequest);

            final HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/refunds/create"))
                .header("Content-Type", "application/json")
                .header("X-Api-Key", credentials.apiKey())
                .header("X-Merchant-Id", credentials.merchantId())
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            final HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                final JsonNode json = MAPPER.readTree(response.body());

                if (json.has("success") && json.get("success").asBoolean()) {
                    final JsonNode data = json.get("data");
                    final String refundId = data.get("refund_id").asText();
                    final String status = data.has("status") ? data.get("status").asText() : "PROCESSING";

                    if ("SUCCESS".equalsIgnoreCase(status) || "PROCESSED".equalsIgnoreCase(status)) {
                        return GatewayRefundResult.success(refundId, response.body());
                    } else {
                        return GatewayRefundResult.processing(refundId, response.body());
                    }
                } else {
                    final String errorMsg = json.has("message") ? json.get("message").asText() : "Refund failed";
                    return GatewayRefundResult.failure(errorMsg, response.body());
                }
            } else {
                final JsonNode json = MAPPER.readTree(response.body());
                final String errorMsg = json.has("message") ? json.get("message").asText() : "Refund failed";
                return GatewayRefundResult.failure(errorMsg, response.body());
            }
        } catch (final Exception e) {
            return GatewayRefundResult.failure("Refund error: " + e.getMessage(), null);
        }
    }

    @Override
    public WebhookEvent parseWebhook(final String payload, final String signatureHeader) {
        try {
            final JsonNode json = MAPPER.readTree(payload);

            // Verify webhook signature
            final String expectedSignature = generateWebhookSignature(payload);
            if (signatureHeader != null && !expectedSignature.equals(signatureHeader)) {
                return WebhookEvent.invalid("Invalid webhook signature");
            }

            final String eventType = json.has("event") ? json.get("event").asText() : "unknown";
            final JsonNode data = json.get("data");

            final String orderId = data.has("order_id") ? data.get("order_id").asText() : null;
            final String paymentId = data.has("payment_id") ? data.get("payment_id").asText() : null;
            final String status = data.has("status") ? data.get("status").asText() : null;

            return switch (eventType.toLowerCase()) {
                case "payment.success", "payment.captured" ->
                    WebhookEvent.paymentSuccess(orderId, paymentId, payload);
                case "payment.failed" ->
                    WebhookEvent.paymentFailed(orderId, paymentId, status, payload);
                case "refund.success", "refund.processed" -> {
                    final String refundId = data.has("refund_id") ? data.get("refund_id").asText() : null;
                    yield WebhookEvent.refundSuccess(paymentId, refundId, payload);
                }
                case "refund.failed" -> {
                    final String refundId = data.has("refund_id") ? data.get("refund_id").asText() : null;
                    yield WebhookEvent.refundFailed(paymentId, refundId, status, payload);
                }
                default -> WebhookEvent.unknown(eventType, payload);
            };
        } catch (final Exception e) {
            return WebhookEvent.invalid("Failed to parse webhook: " + e.getMessage());
        }
    }

    @Override
    public boolean supportsWebhooks() {
        return true;
    }

    /**
     * Generate signature for API requests using HMAC-SHA256.
     * BharatPay typically requires signing the request parameters in sorted order.
     */
    private String generateSignature(final Map<String, Object> params) {
        try {
            // Build signature string from sorted parameters
            final StringBuilder signatureData = new StringBuilder();
            final TreeMap<String, Object> sortedParams = new TreeMap<>(params);

            for (final Map.Entry<String, Object> entry : sortedParams.entrySet()) {
                if (!"signature".equals(entry.getKey()) && entry.getValue() != null) {
                    if (signatureData.length() > 0) {
                        signatureData.append("|");
                    }
                    signatureData.append(entry.getValue().toString());
                }
            }

            return generateHmacSha256(signatureData.toString(), credentials.secretKey());
        } catch (final Exception e) {
            throw new RuntimeException("Failed to generate signature", e);
        }
    }

    /**
     * Generate HMAC-SHA256 signature.
     */
    private String generateHmacSha256(final String data, final String key) throws Exception {
        final Mac mac = Mac.getInstance("HmacSHA256");
        final SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKeySpec);
        final byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(hash);
    }

    /**
     * Convert bytes to hex string.
     */
    private String bytesToHex(final byte[] bytes) {
        final StringBuilder hexString = new StringBuilder();
        for (final byte b : bytes) {
            final String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
