package com.foodgrid.lead.service;

import com.foodgrid.lead.model.Lead;
import com.foodgrid.lead.repo.LeadRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.UUID;

@ApplicationScoped
public class PitchService {

    @Inject
    LeadRepository leadRepository;

    @Inject
    LeadService leadService;

    public String generatePitchLink(Long leadId) {
        Lead lead = leadRepository.findById(leadId);
        if (lead == null) return null;

        String trackingToken = UUID.randomUUID().toString();
        
        // Record activity that pitch was sent
        leadService.addActivity(leadId, "PITCH", "Pitch deck link generated", "SYSTEM");
        
        // points to the /pitch route in the public group
        return "https://foodgrid.com/pitch/view?token=" + trackingToken + "&leadId=" + leadId;
    }

    public void trackOpening(Long leadId, String metadata) {
        leadService.addActivity(leadId, "ENGAGEMENT", "Pitch link opened", "SYSTEM");
    }
}
