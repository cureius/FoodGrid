package com.foodgrid.payment.repo;

import com.foodgrid.payment.model.ClientPaymentConfig;
import com.foodgrid.payment.model.PaymentGatewayType;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ClientPaymentConfigRepository implements PanacheRepositoryBase<ClientPaymentConfig, String> {

    public Optional<ClientPaymentConfig> findActiveByClientAndGateway(final String clientId, final PaymentGatewayType gatewayType) {
        return find("clientId = ?1 and gatewayType = ?2 and isActive = true", clientId, gatewayType).firstResultOptional();
    }

    public Optional<ClientPaymentConfig> findPrimaryActiveByClient(final String clientId) {
        return find("clientId = ?1 and isActive = true order by createdAt asc", clientId).firstResultOptional();
    }

    public List<ClientPaymentConfig> findAllActiveByClient(final String clientId) {
        return list("clientId = ?1 and isActive = true", clientId);
    }

    public List<ClientPaymentConfig> findAllByClient(final String clientId) {
        return list("clientId = ?1 order by createdAt desc", clientId);
    }

    public boolean existsByClientAndGateway(final String clientId, final PaymentGatewayType gatewayType) {
        return count("clientId = ?1 and gatewayType = ?2", clientId, gatewayType) > 0;
    }
}
