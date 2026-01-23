package com.foodgrid.payment.service;

import com.foodgrid.common.audit.AuditLogService;
import com.foodgrid.common.util.EncryptionUtil;
import com.foodgrid.common.util.Ids;
import com.foodgrid.payment.dto.PaymentConfigRequest;
import com.foodgrid.payment.dto.PaymentConfigResponse;
import com.foodgrid.payment.gateway.PaymentGatewayFactory;
import com.foodgrid.payment.model.ClientPaymentConfig;
import com.foodgrid.payment.model.PaymentGatewayType;
import com.foodgrid.payment.repo.ClientPaymentConfigRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.time.Instant;
import java.util.Date;
import java.util.List;

/**
 * Service for managing client payment gateway configurations.
 */
@ApplicationScoped
public class PaymentConfigService {

    @Inject
    ClientPaymentConfigRepository configRepository;

    @Inject
    EncryptionUtil encryptionUtil;

    @Inject
    PaymentGatewayFactory gatewayFactory;

    @Inject
    AuditLogService auditService;

    /**
     * Create or update payment gateway configuration for a client.
     */
    @Transactional
    public PaymentConfigResponse saveConfig(final String clientId, final PaymentConfigRequest request) {
        // Check if config already exists for this gateway type
        final var existing = configRepository.findActiveByClientAndGateway(clientId, request.gatewayType());

        final ClientPaymentConfig config;
        boolean isNew = false;

        if (existing.isPresent()) {
            config = existing.get();
        } else {
            config = new ClientPaymentConfig();
            config.id = Ids.uuid();
            config.clientId = clientId;
            config.gatewayType = request.gatewayType();
            config.createdAt = Date.from(Instant.now());
            isNew = true;
        }

        // Encrypt and store credentials
        config.apiKeyEncrypted = encryptionUtil.encrypt(request.apiKey());
        config.secretKeyEncrypted = encryptionUtil.encrypt(request.secretKey());
        config.webhookSecretEncrypted = request.webhookSecret() != null ?
            encryptionUtil.encrypt(request.webhookSecret()) : null;
        config.merchantId = request.merchantId();
        config.isLiveMode = request.isLiveMode();
        config.additionalConfig = request.additionalConfig();
        config.isActive = true;
        config.updatedAt = Date.from(Instant.now());

        configRepository.persist(config);

        // Invalidate gateway cache
        gatewayFactory.invalidateCache(clientId, request.gatewayType());

        auditService.record(isNew ? "PAYMENT_CONFIG_CREATED" : "PAYMENT_CONFIG_UPDATED",
            null, "ClientPaymentConfig", config.id,
            "client=" + clientId + ", gateway=" + request.gatewayType() + ", live=" + request.isLiveMode());

        return toResponse(config);
    }

    /**
     * Get all payment configurations for a client.
     */
    public List<PaymentConfigResponse> getConfigs(final String clientId) {
        return configRepository.findAllByClient(clientId).stream()
            .map(this::toResponse)
            .toList();
    }

    /**
     * Get active payment configurations for a client.
     */
    public List<PaymentConfigResponse> getActiveConfigs(final String clientId) {
        return configRepository.findAllActiveByClient(clientId).stream()
            .map(this::toResponse)
            .toList();
    }

    /**
     * Get a specific configuration.
     */
    public PaymentConfigResponse getConfig(final String configId) {
        final ClientPaymentConfig config = configRepository.findById(configId);
        if (config == null) {
            throw new NotFoundException("Configuration not found");
        }
        return toResponse(config);
    }

    /**
     * Deactivate a payment configuration.
     */
    @Transactional
    public void deactivateConfig(final String clientId, final PaymentGatewayType gatewayType) {
        final var config = configRepository.findActiveByClientAndGateway(clientId, gatewayType)
            .orElseThrow(() -> new NotFoundException("Configuration not found"));

        config.isActive = false;
        config.updatedAt = Date.from(Instant.now());
        configRepository.persist(config);

        // Invalidate gateway cache
        gatewayFactory.invalidateCache(clientId, gatewayType);

        auditService.record("PAYMENT_CONFIG_DEACTIVATED", null, "ClientPaymentConfig", config.id,
            "client=" + clientId + ", gateway=" + gatewayType);
    }

    /**
     * Reactivate a payment configuration.
     */
    @Transactional
    public PaymentConfigResponse reactivateConfig(final String configId) {
        final ClientPaymentConfig config = configRepository.findById(configId);
        if (config == null) {
            throw new NotFoundException("Configuration not found");
        }

        // Deactivate any other active config for the same gateway type
        configRepository.findActiveByClientAndGateway(config.clientId, config.gatewayType)
            .ifPresent(existing -> {
                if (!existing.id.equals(configId)) {
                    existing.isActive = false;
                    existing.updatedAt = Date.from(Instant.now());
                    configRepository.persist(existing);
                }
            });

        config.isActive = true;
        config.updatedAt = Date.from(Instant.now());
        configRepository.persist(config);

        // Invalidate gateway cache
        gatewayFactory.invalidateCache(config.clientId, config.gatewayType);

        auditService.record("PAYMENT_CONFIG_REACTIVATED", null, "ClientPaymentConfig", config.id,
            "client=" + config.clientId + ", gateway=" + config.gatewayType);

        return toResponse(config);
    }

    /**
     * Delete a payment configuration permanently.
     */
    @Transactional
    public void deleteConfig(final String configId) {
        final ClientPaymentConfig config = configRepository.findById(configId);
        if (config == null) {
            throw new NotFoundException("Configuration not found");
        }

        final String clientId = config.clientId;
        final PaymentGatewayType gatewayType = config.gatewayType;

        configRepository.delete(config);

        // Invalidate gateway cache
        gatewayFactory.invalidateCache(clientId, gatewayType);

        auditService.record("PAYMENT_CONFIG_DELETED", null, "ClientPaymentConfig", configId,
            "client=" + clientId + ", gateway=" + gatewayType);
    }

    /**
     * Validate gateway credentials by testing connection.
     */
    public boolean validateCredentials(final String clientId, final PaymentGatewayType gatewayType) {
        try {
            // This will throw if credentials are invalid or gateway can't be initialized
            gatewayFactory.getGateway(clientId, gatewayType);
            return true;
        } catch (final Exception e) {
            return false;
        }
    }

    /**
     * Get supported gateway types.
     */
    public List<GatewayTypeInfo> getSupportedGateways() {
        return List.of(
            new GatewayTypeInfo(PaymentGatewayType.RAZORPAY, "Razorpay", "INR", true),
            new GatewayTypeInfo(PaymentGatewayType.STRIPE, "Stripe", "USD", true),
            new GatewayTypeInfo(PaymentGatewayType.PAYU, "PayU", "INR", true),
            new GatewayTypeInfo(PaymentGatewayType.PHONEPE, "PhonePe", "INR", false),
            new GatewayTypeInfo(PaymentGatewayType.CASHFREE, "Cashfree", "INR", false)
        );
    }

    /**
     * Invalidate gateway cache for a client.
     */
    public void invalidateCache(String clientId, PaymentGatewayType gatewayType) {
        gatewayFactory.invalidateCache(clientId, gatewayType);
    }

    private PaymentConfigResponse toResponse(final ClientPaymentConfig config) {
        return new PaymentConfigResponse(
            config.id, config.clientId, config.gatewayType,
            config.merchantId, config.isActive, config.isLiveMode,
            config.createdAt, config.updatedAt
        );
    }

    /**
     * Gateway type information for UI.
     */
    public record GatewayTypeInfo(
        PaymentGatewayType type,
        String displayName,
        String defaultCurrency,
        boolean isImplemented
    ) {}
}
