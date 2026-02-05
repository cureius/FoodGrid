package com.foodgrid.lead.repo;

import com.foodgrid.lead.model.RawPlaceData;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class RawPlaceDataRepository implements PanacheRepository<RawPlaceData> {
    public List<RawPlaceData> findUnprocessed() {
        return list("isProcessed = false");
    }

    public RawPlaceData findByExternalPlaceId(String externalPlaceId) {
        return find("externalPlaceId", externalPlaceId).firstResult();
    }
}
