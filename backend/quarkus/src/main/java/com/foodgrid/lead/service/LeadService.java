package com.foodgrid.lead.service;

import com.foodgrid.lead.model.Lead;
import com.foodgrid.lead.model.LeadActivity;
import com.foodgrid.lead.model.LeadStatus;
import com.foodgrid.lead.repo.LeadActivityRepository;
import com.foodgrid.lead.repo.LeadRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.Date;
import java.util.List;

@ApplicationScoped
public class LeadService {

    @Inject
    LeadRepository leadRepository;

    @Inject
    LeadActivityRepository leadActivityRepository;

    @Inject
    LeadDiscoveryService discoveryService;

    public List<Lead> list(LeadStatus status, String city, String area, String address, String name) {
        StringBuilder query = new StringBuilder("1=1");
        java.util.Map<String, Object> params = new java.util.HashMap<>();

        if (status != null) {
            query.append(" and status = :status");
            params.put("status", status);
        }
        if (city != null && !city.isBlank()) {
            query.append(" and city = :city");
            params.put("city", city);
        }
        if (area != null && !area.isBlank()) {
            query.append(" and area = :area");
            params.put("area", area);
        }
        if (address != null && !address.isBlank()) {
            query.append(" and address like :address");
            params.put("address", "%" + address + "%");
        }
        if (name != null && !name.isBlank()) {
            query.append(" and name like :name");
            params.put("name", "%" + name + "%");
        }

        query.append(" order by score desc");
        return leadRepository.find(query.toString(), params).list();
    }

    public Lead get(Long id) {
        return leadRepository.findById(id);
    }

    @Transactional
    public void updateStatus(Long id, LeadStatus status) {
        Lead lead = leadRepository.findById(id);
        if (lead != null) {
            lead.status = status;
            lead.updatedAt = new Date();
            leadRepository.persist(lead);
        }
    }

    @Transactional
    public void addActivity(Long leadId, String channel, String outcome, String performedBy) {
        Lead lead = leadRepository.findById(leadId);
        if (lead != null) {
            LeadActivity activity = new LeadActivity();
            activity.lead = lead;
            activity.channel = channel;
            activity.outcome = outcome;
            activity.performedBy = performedBy;
            activity.performedAt = new Date();
            leadActivityRepository.persist(activity);
            
            lead.updatedAt = new Date();
            leadRepository.persist(lead);
        }
    }

    public boolean triggerDiscovery(String city, String area, String category) {
        // Run in background would be better, but for now we'll just call it
        // In a real app, this should be an async task
        return discoveryService.discoverLeads(city, area, category);
    }
}
