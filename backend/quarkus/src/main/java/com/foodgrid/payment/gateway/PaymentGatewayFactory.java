package com.foodgrid.payment.gateway;

import com.foodgrid.common.util.EncryptionUtil;
import com.foodgrid.payment.dto.GatewayCredentials;
import com.foodgrid.payment.gateway.impl.BharatPayGateway;
import com.foodgrid.payment.gateway.impl.PayUGateway;
import com.foodgrid.payment.gateway.impl.RazorpayGateway;
import com.foodgrid.payment.gateway.impl.StripeGateway;
import com.foodgrid.payment.model.ClientPaymentConfig;
import com.foodgrid.payment.model.PaymentGatewayType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Factory for creating and caching PaymentGateway instances.
 * Uses factory pattern to return the appropriate gateway implementation
 * based on client configuration.
 */
@ApplicationScoped
public class PaymentGatewayFactory {

    @Inject
    EncryptionUtil encryptionUtil;

    // Cache of initialized gateways per client+gateway combination
    private final Map<String, PaymentGateway> gatewayCache = new ConcurrentHashMap<>();

    /**
     * Get a payment gateway for a client based on their configuration.
     *
     * @param config The client's payment configuration
     * @return Initialized payment gateway
     */
    public PaymentGateway getGateway(final ClientPaymentConfig config) {
        if (config == null) {
            throw new BadRequestException("No payment configuration found");
        }

        // Validate that credentials are configured
        if (config.apiKeyEncrypted == null || config.apiKeyEncrypted.isBlank() ||
            config.secretKeyEncrypted == null || config.secretKeyEncrypted.isBlank()) {
            throw new BadRequestException(
                "Payment gateway credentials not configured for " + config.gatewayType + ". " +
                "Please configure API keys using: POST /api/v1/payment-config"
            );
        }

        final String cacheKey = config.clientId + ":" + config.gatewayType.name() + ":" + config.isLiveMode;

        return gatewayCache.computeIfAbsent(cacheKey, key -> {
            final GatewayCredentials credentials = decryptCredentials(config);
            final PaymentGateway gateway = createGateway(config.gatewayType);
            gateway.initialize(credentials);
            return gateway;
        });
    }

    /**
     * Get gateway for a specific type (used when client has multiple configured gateways).
     */
    public PaymentGateway getGateway(final String clientId, final PaymentGatewayType gatewayType) {
        final ClientPaymentConfig config = ClientPaymentConfig.findActiveByClientAndGateway(clientId, gatewayType);
        if (config == null) {
            throw new BadRequestException("Gateway " + gatewayType + " not configured for client");
        }
        return getGateway(config);
    }

    /**
     * Get the primary (default) gateway for a client.
     */
    public PaymentGateway getPrimaryGateway(final String clientId) {
        final ClientPaymentConfig config = ClientPaymentConfig.findPrimaryActiveByClient(clientId);
        if (config == null) {
            throw new BadRequestException("No payment gateway configured for client");
        }
        return getGateway(config);
    }

    /**
     * Clear cached gateway for a client (use when credentials are updated).
     */
    public void invalidateCache(final String clientId, final PaymentGatewayType gatewayType) {
        gatewayCache.entrySet().removeIf(entry ->
            entry.getKey().startsWith(clientId + ":" + gatewayType.name()));
    }

    /**
     * Clear all cached gateways for a client.
     */
    public void invalidateClientCache(final String clientId) {
        gatewayCache.entrySet().removeIf(entry ->
            entry.getKey().startsWith(clientId + ":"));
    }

    /**
     * Create a new gateway instance based on type.
     */
    private PaymentGateway createGateway(final PaymentGatewayType type) {
        return switch (type) {
            case RAZORPAY -> new RazorpayGateway();
            case STRIPE -> new StripeGateway();
            case PAYU -> new PayUGateway();
            case BHARATPAY -> new BharatPayGateway();
            case PHONEPE -> throw new BadRequestException("PhonePe gateway not yet implemented");
            case CASHFREE -> throw new BadRequestException("Cashfree gateway not yet implemented");
        };
    }

    /**
     * Decrypt credentials from config.
     * Assumes credentials are already validated (non-null) before calling this method.
     */
    private GatewayCredentials decryptCredentials(final ClientPaymentConfig config) {
        return new GatewayCredentials(
            config.gatewayType,
            encryptionUtil.decrypt(config.apiKeyEncrypted),
            encryptionUtil.decrypt(config.secretKeyEncrypted),
            config.webhookSecretEncrypted != null ? encryptionUtil.decrypt(config.webhookSecretEncrypted) : null,
            config.merchantId,
            config.isLiveMode,
            config.additionalConfig
        );
    }
}
