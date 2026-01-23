package com.foodgrid.payment.model;

import com.foodgrid.admin.model.Client;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.util.Date;

/**
 * Stores encrypted payment gateway credentials per client.
 * Each client can have multiple gateway configurations but only one active per gateway type.
 */
@Entity
@Table(name = "client_payment_configs")
public class ClientPaymentConfig extends PanacheEntityBase {

    @Id
    @Column(length = 36)
    public String id;

    @Column(name = "client_id", nullable = false, length = 36)
    public String clientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", referencedColumnName = "id", insertable = false, updatable = false)
    public Client client;

    @Enumerated(EnumType.STRING)
    @Column(name = "gateway_type", nullable = false, length = 50)
    public PaymentGatewayType gatewayType;

    /** Encrypted API key / Key ID - nullable until credentials are configured */
    @Column(name = "api_key_encrypted", nullable = true, columnDefinition = "TEXT")
    public String apiKeyEncrypted;

    /** Encrypted Secret key - nullable until credentials are configured */
    @Column(name = "secret_key_encrypted", nullable = true, columnDefinition = "TEXT")
    public String secretKeyEncrypted;

    /** Encrypted webhook secret for signature verification */
    @Column(name = "webhook_secret_encrypted", columnDefinition = "TEXT")
    public String webhookSecretEncrypted;

    /** Merchant ID (PayU, etc.) */
    @Column(name = "merchant_id", length = 255)
    public String merchantId;

    @Column(name = "is_active")
    public boolean isActive = true;

    @Column(name = "is_live_mode")
    public boolean isLiveMode = false;

    /** Additional JSON config for gateway-specific settings */
    @Column(name = "additional_config", columnDefinition = "TEXT")
    public String additionalConfig;

    @Column(name = "auto_capture_enabled")
    public boolean autoCaptureEnabled = true;

    @Column(name = "partial_refund_enabled")
    public boolean partialRefundEnabled = true;

    @Column(name = "webhook_url", length = 500)
    public String webhookUrl;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at")
    public Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    public Date updatedAt;

    /**
     * Find active config for a client by gateway type.
     */
    public static ClientPaymentConfig findActiveByClientAndGateway(final String clientId, final PaymentGatewayType gatewayType) {
        return find("clientId = ?1 and gatewayType = ?2 and isActive = true", clientId, gatewayType).firstResult();
    }

    /**
     * Find the primary (first active) payment config for a client.
     */
    public static ClientPaymentConfig findPrimaryActiveByClient(final String clientId) {
        return find("clientId = ?1 and isActive = true order by createdAt asc", clientId).firstResult();
    }

    /**
     * Find all active configs for a client.
     */
    public static java.util.List<ClientPaymentConfig> findAllActiveByClient(final String clientId) {
        return list("clientId = ?1 and isActive = true", clientId);
    }
}
