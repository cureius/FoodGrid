package com.foodgrid.lead.repo;

import com.foodgrid.lead.model.LeadContact;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class LeadContactRepository implements PanacheRepository<LeadContact> {
    public List<LeadContact> findByLeadId(Long leadId) {
        return list("lead.id", leadId);
    }

    public LeadContact findSpoc(Long leadId) {
        return find("lead.id = ?1 and isSpoc = true", leadId).firstResult();
    }
}
