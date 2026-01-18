package com.foodgrid.payment.repo;

import com.foodgrid.payment.model.GatewayRefund;
import com.foodgrid.payment.model.RefundStatus;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class GatewayRefundRepository implements PanacheRepositoryBase<GatewayRefund, String> {

    public List<GatewayRefund> findByTransactionId(final String transactionId) {
        return list("transactionId", transactionId);
    }

    public Optional<GatewayRefund> findByGatewayRefundId(final String gatewayRefundId) {
        return find("gatewayRefundId", gatewayRefundId).firstResultOptional();
    }

    public List<GatewayRefund> findPendingRefunds() {
        return list("status", RefundStatus.PROCESSING);
    }
}
