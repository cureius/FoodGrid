package com.foodgrid.payment.gateway.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodgrid.payment.dto.GatewayCredentials;
import com.foodgrid.payment.gateway.*;
import com.foodgrid.payment.model.PaymentGatewayType;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

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

    private static final Logger LOG = Logger.getLogger(RazorpayGateway.class);
    private static final String BASE_URL = "https://api.razorpay.com/v1";
    private static final ObjectMapper MAPPER = new ObjectMapper();


    @ConfigProperty(name = "foodgrid.razorpay.webhook.url", defaultValue = "https://foodgrid-production-f778.up.railway.app/api/v1/webhooks/payment/razorpay")
    String webhookUrl = "https://foodgrid-production-f778.up.railway.app/api/v1/webhooks/payment/razorpay";

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
                .uri(URI.create(BASE_URL + "/refunds"))
                .header("Content-Type", "application/json")
                .header("Authorization", getBasicAuth())
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            final HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                final JsonNode json = MAPPER.readTree(response.body());
                final String refundId = json.get("id").asText();
                return GatewayRefundResult.success(refundId, response.body());
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

    /**
     * Create a payment link using Razorpay Payment Links API.
     * This is used for generating shareable payment links.
     */
    public GatewayOrderResult createPaymentLink(final String orderId, final BigDecimal amount, final String currency,
                                               final String description, final String customerName, 
                                               final String customerContact, final String callbackUrl) {
        try {
            // Razorpay expects amount in paise (smallest currency unit)
            final long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();

            final Map<String, Object> paymentLinkRequest = new HashMap<>();
            paymentLinkRequest.put("amount", amountInPaise);
            paymentLinkRequest.put("currency", currency);
            paymentLinkRequest.put("reference_id", orderId);
            paymentLinkRequest.put("description", description != null ? description : "Payment for Order " + orderId);
            
            // Add customer information if provided
            if (customerName != null || customerContact != null) {
                final Map<String, Object> customer = new HashMap<>();
                if (customerName != null) {
                    customer.put("name", customerName);
                }
                if (customerContact != null) {
                    customer.put("contact", customerContact);
                }
                paymentLinkRequest.put("customer", customer);
            }
            
            // Add callback URL if provided

//            if (webhookUrl != null && !webhookUrl.isBlank()) {
//                paymentLinkRequest.put("callback_url", webhookUrl);
//                paymentLinkRequest.put("callback_method", "get");
//            }

            final String requestBody = MAPPER.writeValueAsString(paymentLinkRequest);

            final HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/payment_links"))
                .header("Content-Type", "application/json")
                .header("Authorization", getBasicAuth())
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            final HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                final JsonNode json = MAPPER.readTree(response.body());
                final String paymentLinkId = json.get("id").asText();
                final String shortUrl = json.get("short_url").asText();

                // Client data needed for payment link response
                final Map<String, Object> clientData = new HashMap<>();
                clientData.put("payment_link_id", paymentLinkId);
                clientData.put("short_url", shortUrl);
                clientData.put("amount", amountInPaise);
                clientData.put("currency", currency);

                return GatewayOrderResult.success(paymentLinkId, clientData, response.body());
            } else {
                final JsonNode json = MAPPER.readTree(response.body());
                final String errorMsg = json.has("error") ?
                    json.get("error").get("description").asText() : "Payment link creation failed";
                return GatewayOrderResult.failure(errorMsg, response.body());
            }
        } catch (final Exception e) {
            return GatewayOrderResult.failure("Razorpay Payment Link API error: " + e.getMessage(), null);
        }
    }

    /**
     * Create a mock payment link for testing with test credentials.
     */
    private GatewayOrderResult createMockPaymentLink(final String orderId, final BigDecimal amount, final String currency, final String description) {
        try {
            final long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();
            final String paymentLinkId = "plink_mock_" + orderId.substring(0, 8) + "_" + System.currentTimeMillis();
            final String shortUrl = "https://rzp.io/mock/" + paymentLinkId.substring(5);

            // Mock response similar to Razorpay's actual response
            final Map<String, Object> mockResponse = new HashMap<>();
            mockResponse.put("id", paymentLinkId);
            mockResponse.put("entity", "payment_link");
            mockResponse.put("amount", amountInPaise);
            mockResponse.put("amount_paid", 0);
            mockResponse.put("currency", currency);
            mockResponse.put("reference_id", orderId);
            mockResponse.put("description", description != null ? description : "Payment for Order " + orderId);
            mockResponse.put("status", "created");
            mockResponse.put("short_url", shortUrl);
            mockResponse.put("created_at", System.currentTimeMillis() / 1000);
            mockResponse.put("accept_partial", false);
            mockResponse.put("expire_by", 0);
            mockResponse.put("expired_at", 0);

            // Client data needed for payment link response
            final Map<String, Object> clientData = new HashMap<>();
            clientData.put("payment_link_id", paymentLinkId);
            clientData.put("short_url", shortUrl);
            clientData.put("amount", amountInPaise);
            clientData.put("currency", currency);

            final String mockResponseJson = MAPPER.writeValueAsString(mockResponse);
            return GatewayOrderResult.success(paymentLinkId, clientData, mockResponseJson);
        } catch (final Exception e) {
            return GatewayOrderResult.failure("Mock payment link creation failed: " + e.getMessage(), null);
        }
    }

    @Override
    public WebhookEvent parseWebhook(final String payload, final String signature) {
        try {
            final JsonNode json = MAPPER.readTree(payload);
            final String eventType = json.get("razorpay_payment_link_status").asText().equals("paid") ? "payment.success" : "payment.failed" ;

            final String gatewayOrderId = json.has("razorpay_payment_link_id") ?
                json.get("razorpay_payment_link_id").asText() : null;
            final String gatewayPaymentId = json.has("razorpay_payment_id") ?
                json.get("razorpay_payment_id").asText() : null;
            final String status = json.has("razorpay_payment_link_status") ?
                json.get("razorpay_payment_link_status").asText() : null;
            final String method = json.has("method") ?
                json.get("method").asText() : "online";
            @SuppressWarnings("unchecked") final Map<String, Object> rawData = MAPPER.convertValue(json, Map.class);

            return new WebhookEvent(eventType, gatewayOrderId, gatewayPaymentId, status, method, rawData);
        } catch (final Exception e) {
            throw new RuntimeException("Failed to parse webhook: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean verifyWebhookSignature(final String payload, final String signature) {
        // For now, always return true to allow webhook processing
        // TODO: Implement proper signature verification when webhook secret is configured
        LOG.infof("Webhook signature verification - payload: %s, signature: %s", payload, signature);
        return true;
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
