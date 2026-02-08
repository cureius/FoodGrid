package com.foodgrid.integration.service;

import com.foodgrid.integration.adapter.ChannelAdapter;
import com.foodgrid.integration.adapter.SwiggyAdapter;
import com.foodgrid.integration.adapter.ZomatoAdapter;
import com.foodgrid.integration.model.SourceChannel;
import com.foodgrid.integration.repo.ChannelIntegrationRepository;
import com.foodgrid.pos.model.Order;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class IntegrationService {

    @Inject
    ChannelIntegrationRepository integrationRepository;

    @Inject
    SwiggyAdapter swiggyAdapter;

    @Inject
    ZomatoAdapter zomatoAdapter;

    private ChannelAdapter getAdapter(SourceChannel channel) {
        return switch (channel) {
            case SWIGGY -> swiggyAdapter;
            case ZOMATO -> zomatoAdapter;
            default -> throw new IllegalArgumentException("Unknown channel: " + channel);
        };
    }

    public void updateExternalStatus(Order order, Order.Status newStatus) {
        if (order.sourceChannel == SourceChannel.FOODGRID || order.externalOrderId == null) {
            return;
        }

        integrationRepository.findByOutletIdAndChannel(order.outletId, order.sourceChannel)
            .ifPresent(integration -> {
                if (integration.isActive) {
                    getAdapter(order.sourceChannel).updateOrderStatus(integration, order, newStatus);
                }
            });
    }

    @Transactional
    public void pushMenu(String outletId, SourceChannel channel) {
        integrationRepository.findByOutletIdAndChannel(outletId, channel)
            .ifPresent(integration -> getAdapter(channel).pushMenu(integration));
    }

    @Transactional
    public void pullMenu(String outletId, SourceChannel channel) {
        integrationRepository.findByOutletIdAndChannel(outletId, channel)
            .ifPresent(integration -> getAdapter(channel).pullMenu(integration));
    }

    public void testConnection(String outletId, SourceChannel channel) {
        integrationRepository.findByOutletIdAndChannel(outletId, channel)
            .ifPresent(integration -> getAdapter(channel).testConnection(integration));
    }
}
