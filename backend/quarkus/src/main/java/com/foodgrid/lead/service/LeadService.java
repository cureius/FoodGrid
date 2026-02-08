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

    public List<Lead> list(LeadStatus status, String city) {
        if (status != null && city != null) {
            return leadRepository.find("status = ?1 and city = ?2 order by score desc", status, city).list();
        } else if (status != null) {
            return leadRepository.find("status = ?1 order by score desc", status).list();
        } else if (city != null) {
            return leadRepository.find("city = ?1 order by score desc", city).list();
        }
        return leadRepository.find("order by score desc").list();
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

    public void triggerDiscovery(String city, String area, String category) {
        // Run in background would be better, but for now we'll just call it
        // In a real app, this should be an async task
        discoveryService.discoverLeads(city, area, category);
    }
}
