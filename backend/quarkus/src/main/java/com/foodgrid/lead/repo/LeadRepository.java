package com.foodgrid.lead.repo;

import com.foodgrid.lead.model.Lead;
import com.foodgrid.lead.model.LeadStatus;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class LeadRepository implements PanacheRepository<Lead> {
    public Lead findByExternalPlaceId(String externalPlaceId) {
        return find("externalPlaceId", externalPlaceId).firstResult();
    }

    public List<Lead> findByStatus(LeadStatus status) {
        return list("status", status);
    }

    public List<Lead> findHighScored(Double minScore) {
        return find("score >= ?1 order by score desc", minScore).list();
    }
}
