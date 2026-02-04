package com.foodgrid.integration.repo;

import com.foodgrid.integration.model.ChannelIntegration;
import com.foodgrid.integration.model.SourceChannel;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ChannelIntegrationRepository implements PanacheRepositoryBase<ChannelIntegration, String> {
    public List<ChannelIntegration> findByOutletId(String outletId) {
        return list("outletId", outletId);
    }

    public Optional<ChannelIntegration> findByOutletIdAndChannel(String outletId, SourceChannel channel) {
        return find("outletId = ?1 and channel = ?2", outletId, channel).firstResultOptional();
    }
}
