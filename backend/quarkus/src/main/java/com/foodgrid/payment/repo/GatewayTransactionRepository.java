package com.foodgrid.payment.repo;

import com.foodgrid.payment.model.GatewayTransaction;
import com.foodgrid.payment.model.GatewayTransactionStatus;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class GatewayTransactionRepository implements PanacheRepositoryBase<GatewayTransaction, String> {

    public Optional<GatewayTransaction> findByGatewayOrderId(final String gatewayOrderId) {
        return find("gatewayOrderId", gatewayOrderId).firstResultOptional();
    }

    public Optional<GatewayTransaction> findByGatewayPaymentId(final String gatewayPaymentId) {
        return find("gatewayPaymentId", gatewayPaymentId).firstResultOptional();
    }

    public Optional<GatewayTransaction> findByOrderId(final String orderId) {
        return find("orderId = ?1 order by createdAt desc", orderId).firstResultOptional();
    }

    public List<GatewayTransaction> findAllByOrderId(final String orderId) {
        return list("orderId = ?1 order by createdAt desc", orderId);
    }

    public List<GatewayTransaction> findByTenantId(final String tenantId) {
        return list("tenantId = ?1 order by createdAt desc", tenantId);
    }

    public List<GatewayTransaction> findByClientId(final String clientId) {
        return list("clientId = ?1 order by createdAt desc", clientId);
    }

    public List<GatewayTransaction> findByOutletId(final String outletId, final int limit) {
        return find("outletId = ?1 order by createdAt desc", outletId).page(0, limit).list();
    }

    public Optional<GatewayTransaction> findByIdempotencyKey(final String idempotencyKey) {
        return find("idempotencyKey", idempotencyKey).firstResultOptional();
    }

    public List<GatewayTransaction> findPendingTransactions() {
        return list("status in (?1, ?2) order by createdAt asc",
            GatewayTransactionStatus.INITIATED, GatewayTransactionStatus.PENDING);
    }

    public long countByStatus(final GatewayTransactionStatus status) {
        return count("status", status);
    }
}
