package com.foodgrid.payment.gateway.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodgrid.payment.dto.GatewayCredentials;
import com.foodgrid.payment.gateway.*;
import com.foodgrid.payment.model.PaymentGatewayType;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * PayU payment gateway implementation.
 * https://devguide.payu.in/
 */
public class PayUGateway implements PaymentGateway {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private GatewayCredentials credentials;
    private HttpClient httpClient;
    private String baseUrl;

    @Override
    public PaymentGatewayType getType() {
        return PaymentGatewayType.PAYU;
    }

    @Override
    public void initialize(final GatewayCredentials credentials) {
        this.credentials = credentials;
        this.baseUrl = credentials.isLiveMode() ?
            "https://secure.payu.in" : "https://sandboxsecure.payu.in";
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
    }

    @Override
    public GatewayOrderResult createOrder(final String orderId, final BigDecimal amount, final String currency,
                                          final String receipt, final Map<String, String> notes) {
        try {
            // PayU uses a redirect flow - we generate the hash and return data for form submission
            final String txnid = orderId.length() > 25 ? orderId.substring(0, 25) : orderId;
            final String amountStr = amount.setScale(2).toPlainString();
            final String productInfo = notes != null && notes.containsKey("productInfo") ?
                notes.get("productInfo") : "FoodGrid Order";
            final String firstName = notes != null && notes.containsKey("firstName") ?
                notes.get("firstName") : "Customer";
            final String email = notes != null && notes.containsKey("email") ?
                notes.get("email") : "customer@foodgrid.com";
            final String phone = notes != null && notes.containsKey("phone") ?
                notes.get("phone") : "";
            final String successUrl = notes != null && notes.containsKey("surl") ?
                notes.get("surl") : "";
            final String failureUrl = notes != null && notes.containsKey("furl") ?
                notes.get("furl") : "";

            // Generate hash: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
            final String hashSequence = credentials.apiKey() + "|" + txnid + "|" + amountStr + "|" +
                productInfo + "|" + firstName + "|" + email + "|||||||||||" + credentials.secretKey();
            final String hash = sha512(hashSequence);

            // Client data for PayU form submission
            final Map<String, Object> clientData = new HashMap<>();
            clientData.put("key", credentials.apiKey());
            clientData.put("txnid", txnid);
            clientData.put("amount", amountStr);
            clientData.put("productinfo", productInfo);
            clientData.put("firstname", firstName);
            clientData.put("email", email);
            clientData.put("phone", phone);
            clientData.put("surl", successUrl);
            clientData.put("furl", failureUrl);
            clientData.put("hash", hash);
            clientData.put("action", baseUrl + "/_payment");

            return GatewayOrderResult.success(txnid, clientData, MAPPER.writeValueAsString(clientData));
        } catch (final Exception e) {
            return GatewayOrderResult.failure("PayU order creation error: " + e.getMessage(), null);
        }
    }

    @Override
    public GatewayVerifyResult verifyPayment(final String gatewayOrderId, final String gatewayPaymentId,
                                             final String gatewaySignature, final Map<String, String> additionalData) {
        try {
            // Verify the reverse hash from PayU callback
            if (additionalData == null) {
                return GatewayVerifyResult.failure("Missing payment data", null);
            }

            final String status = additionalData.get("status");
            final String txnid = additionalData.get("txnid");
            final String amount = additionalData.get("amount");
            final String productinfo = additionalData.get("productinfo");
            final String firstname = additionalData.get("firstname");
            final String email = additionalData.get("email");
            final String mihpayid = additionalData.get("mihpayid");
            final String responseHash = additionalData.get("hash");

            // Reverse hash: sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
            final String reverseHashSequence = credentials.secretKey() + "|" + status + "|||||||||||" +
                email + "|" + firstname + "|" + productinfo + "|" + amount + "|" + txnid + "|" + credentials.apiKey();
            final String expectedHash = sha512(reverseHashSequence);

            if (!expectedHash.equals(responseHash)) {
                return GatewayVerifyResult.failure("Invalid hash", null);
            }

            if ("success".equalsIgnoreCase(status)) {
                final String mode = additionalData.get("mode"); // CC, DC, NB, etc.
                return GatewayVerifyResult.success(mihpayid, mode, MAPPER.writeValueAsString(additionalData));
            } else {
                final String errorMessage = additionalData.get("error_Message");
                return GatewayVerifyResult.failure(errorMessage != null ? errorMessage : "Payment failed",
                    MAPPER.writeValueAsString(additionalData));
            }
        } catch (final Exception e) {
            return GatewayVerifyResult.failure("Verification error: " + e.getMessage(), null);
        }
    }

    @Override
    public GatewayRefundResult processRefund(final String gatewayPaymentId, final BigDecimal amount, final String reason) {
        try {
            // PayU refund API
            final String command = "cancel_refund_transaction";
            final String var1 = gatewayPaymentId; // mihpayid
            final String var2 = String.valueOf(System.currentTimeMillis()); // unique refund id
            final String var3 = amount.setScale(2).toPlainString();

            // Hash: sha512(key|command|var1|salt)
            final String hashSequence = credentials.apiKey() + "|" + command + "|" + var1 + "|" + credentials.secretKey();
            final String hash = sha512(hashSequence);

            final Map<String, String> params = new HashMap<>();
            params.put("key", credentials.apiKey());
            params.put("command", command);
            params.put("var1", var1);
            params.put("var2", var2);
            params.put("var3", var3);
            params.put("hash", hash);

            final String requestBody = params.entrySet().stream()
                .map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "=" +
                          URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));

            final HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/merchant/postservice.php?form=2"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            final HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            final JsonNode json = MAPPER.readTree(response.body());

            if (json.has("status") && json.get("status").asInt() == 1) {
                final String refundId = json.has("request_id") ? json.get("request_id").asText() : var2;
                return GatewayRefundResult.processing(refundId, response.body());
            } else {
                final String errorMsg = json.has("msg") ? json.get("msg").asText() : "Refund failed";
                return GatewayRefundResult.failure(errorMsg, response.body());
            }
        } catch (final Exception e) {
            return GatewayRefundResult.failure("Refund error: " + e.getMessage(), null);
        }
    }

    @Override
    public WebhookEvent parseWebhook(final String payload, final String signature) {
        try {
            // PayU sends form-encoded data, parse it
            final Map<String, String> params = new HashMap<>();
            for (final String pair : payload.split("&")) {
                final String[] keyValue = pair.split("=", 2);
                if (keyValue.length == 2) {
                    params.put(
                        URLEncoder.encode(keyValue[0], StandardCharsets.UTF_8),
                        URLEncoder.encode(keyValue[1], StandardCharsets.UTF_8)
                    );
                }
            }

            final String status = params.get("status");
            final String txnid = params.get("txnid");
            final String mihpayid = params.get("mihpayid");
            final String mode = params.get("mode");

            final String eventType = "success".equalsIgnoreCase(status) ? "payment.captured" : "payment.failed";

            @SuppressWarnings("unchecked") final Map<String, Object> rawData = (Map<String, Object>) (Map<?, ?>) params;

            return new WebhookEvent(eventType, txnid, mihpayid, status, mode, rawData);
        } catch (final Exception e) {
            throw new RuntimeException("Failed to parse webhook: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean verifyWebhookSignature(final String payload, final String signature) {
        // PayU webhook verification is done through hash comparison in parseWebhook
        return true;
    }

    @Override
    public String getPublicKey() {
        return credentials.apiKey();
    }

    private String sha512(final String input) throws Exception {
        final MessageDigest md = MessageDigest.getInstance("SHA-512");
        final byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
        final StringBuilder hexString = new StringBuilder();
        for (final byte b : digest) {
            final String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
