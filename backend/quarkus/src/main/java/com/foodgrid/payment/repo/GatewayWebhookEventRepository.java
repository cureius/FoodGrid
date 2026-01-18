package com.foodgrid.payment.repo;

import com.foodgrid.payment.model.GatewayWebhookEvent;
import com.foodgrid.payment.model.PaymentGatewayType;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class GatewayWebhookEventRepository implements PanacheRepositoryBase<GatewayWebhookEvent, String> {

    public Optional<GatewayWebhookEvent> findByGatewayEventId(final String eventId) {
        return find("gatewayEventId", eventId).firstResultOptional();
    }

    public List<GatewayWebhookEvent> findUnprocessed() {
        return list("isProcessed = false order by createdAt asc");
    }

    public List<GatewayWebhookEvent> findByGatewayType(final PaymentGatewayType gatewayType) {
        return list("gatewayType = ?1 order by createdAt desc", gatewayType);
    }
}
