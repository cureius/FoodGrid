package com.foodgrid.lead.repo;

import com.foodgrid.lead.model.DiscoveryLog;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class DiscoveryLogRepository implements PanacheRepository<DiscoveryLog> {
    public DiscoveryLog findByCriteria(String city, String area, String category) {
        return find("city = ?1 and area = ?2 and category = ?3", city, area, category).firstResult();
    }
}
