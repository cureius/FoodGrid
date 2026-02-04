package com.foodgrid.integration.adapter;

import com.foodgrid.integration.model.ChannelIntegration;
import com.foodgrid.pos.model.Order;
import java.util.Map;

public interface ChannelAdapter {
    void pushMenu(ChannelIntegration integration);
    void pullMenu(ChannelIntegration integration);
    void updateOrderStatus(ChannelIntegration integration, Order order, Order.Status newStatus);
    boolean validateWebhook(ChannelIntegration integration, String payload, Map<String, String> headers);
    void testConnection(ChannelIntegration integration);
}
