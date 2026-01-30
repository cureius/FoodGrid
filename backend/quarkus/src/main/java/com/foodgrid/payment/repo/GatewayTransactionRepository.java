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

    public List<GatewayTransaction> findByClientIdPaginated(
            final String clientId,
            final int page,
            final int size,
            final String status,
            final String paymentMethod,
            final String fromDate,
            final String toDate) {
        
        final StringBuilder query = new StringBuilder("clientId = ?1");
        int paramIndex = 2;
        
        if (status != null && !status.isBlank()) {
            query.append(" and status = ?").append(paramIndex++);
        }
        if (paymentMethod != null && !paymentMethod.isBlank()) {
            query.append(" and paymentMethod = ?").append(paramIndex++);
        }
        if (fromDate != null && !fromDate.isBlank()) {
            query.append(" and createdAt >= ?").append(paramIndex++);
        }
        if (toDate != null && !toDate.isBlank()) {
            query.append(" and createdAt <= ?").append(paramIndex++);
        }
        
        query.append(" order by createdAt desc");
        
        var panacheQuery = find(query.toString(), buildParams(clientId, status, paymentMethod, fromDate, toDate));
        return panacheQuery.page(page, size).list();
    }

    public long countByClientIdFiltered(
            final String clientId,
            final String status,
            final String paymentMethod,
            final String fromDate,
            final String toDate) {
        
        final StringBuilder query = new StringBuilder("clientId = ?1");
        int paramIndex = 2;
        
        if (status != null && !status.isBlank()) {
            query.append(" and status = ?").append(paramIndex++);
        }
        if (paymentMethod != null && !paymentMethod.isBlank()) {
            query.append(" and paymentMethod = ?").append(paramIndex++);
        }
        if (fromDate != null && !fromDate.isBlank()) {
            query.append(" and createdAt >= ?").append(paramIndex++);
        }
        if (toDate != null && !toDate.isBlank()) {
            query.append(" and createdAt <= ?").append(paramIndex++);
        }
        
        return count(query.toString(), buildParams(clientId, status, paymentMethod, fromDate, toDate));
    }

    private Object[] buildParams(final String clientId, final String status, final String paymentMethod, 
                                  final String fromDate, final String toDate) {
        final java.util.ArrayList<Object> params = new java.util.ArrayList<>();
        params.add(clientId);
        
        if (status != null && !status.isBlank()) {
            params.add(GatewayTransactionStatus.valueOf(status));
        }
        if (paymentMethod != null && !paymentMethod.isBlank()) {
            params.add(paymentMethod);
        }
        if (fromDate != null && !fromDate.isBlank()) {
            params.add(java.time.Instant.parse(fromDate));
        }
        if (toDate != null && !toDate.isBlank()) {
            params.add(java.time.Instant.parse(toDate));
        }
        
        return params.toArray();
    }
}
