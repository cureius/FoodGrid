package com.foodgrid.lead.repo;

import com.foodgrid.lead.model.LeadActivity;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class LeadActivityRepository implements PanacheRepository<LeadActivity> {
    public List<LeadActivity> findByLeadId(Long leadId) {
        return find("lead.id = ?1 order by performedAt desc", leadId).list();
    }
}
