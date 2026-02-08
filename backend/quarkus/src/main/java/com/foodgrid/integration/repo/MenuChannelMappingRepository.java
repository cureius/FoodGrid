package com.foodgrid.integration.repo;

import com.foodgrid.integration.model.MenuChannelMapping;
import com.foodgrid.integration.model.SourceChannel;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;

@ApplicationScoped
public class MenuChannelMappingRepository implements PanacheRepositoryBase<MenuChannelMapping, String> {
    public Optional<MenuChannelMapping> findMapping(String outletId, SourceChannel channel, String foodgridEntityId, MenuChannelMapping.EntityType type) {
        return find("outletId = ?1 and channel = ?2 and foodgridEntityId = ?3 and foodgridEntityType = ?4", 
                outletId, channel, foodgridEntityId, type).firstResultOptional();
    }

    public Optional<MenuChannelMapping> findByExternalId(SourceChannel channel, String externalEntityId) {
        return find("channel = ?1 and externalEntityId = ?2", channel, externalEntityId).firstResultOptional();
    }
}
