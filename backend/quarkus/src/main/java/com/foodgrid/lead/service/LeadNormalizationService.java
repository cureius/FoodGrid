package com.foodgrid.lead.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodgrid.lead.dto.google.GooglePlaceResult;
import com.foodgrid.lead.model.Lead;
import com.foodgrid.lead.model.RawPlaceData;
import com.foodgrid.lead.repo.LeadRepository;
import com.foodgrid.lead.repo.RawPlaceDataRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.util.Date;
import java.util.List;

@ApplicationScoped
public class LeadNormalizationService {

    private static final Logger LOG = Logger.getLogger(LeadNormalizationService.class);

    @Inject
    RawPlaceDataRepository rawPlaceDataRepository;

    @Inject
    LeadRepository leadRepository;

    @Inject
    ObjectMapper objectMapper;

    @Transactional
    public void normalizeUnprocessedLeads() {
        List<RawPlaceData> unprocessed = rawPlaceDataRepository.findUnprocessed();
        LOG.infof("Normalizing %d unprocessed raw data entries", unprocessed.size());

        for (RawPlaceData raw : unprocessed) {
            try {
                processRawData(raw);
                raw.isProcessed = true;
                rawPlaceDataRepository.persist(raw);
            } catch (Exception e) {
                LOG.errorf("Failed to normalize raw data with id: %d", raw.id, e);
            }
        }
    }

    private void processRawData(RawPlaceData raw) throws Exception {
        com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(raw.rawJson);
        GooglePlaceResult result;
        
        // If it's a Place Details response, the data is inside "result" property
        if (node.has("result")) {
            result = objectMapper.treeToValue(node.get("result"), GooglePlaceResult.class);
        } else {
            result = objectMapper.treeToValue(node, GooglePlaceResult.class);
        }
        
        Lead lead = leadRepository.findByExternalPlaceId(raw.externalPlaceId);
        if (lead == null) {
            lead = new Lead();
            lead.externalPlaceId = raw.externalPlaceId;
            lead.createdAt = new Date();
        }

        lead.name = result.name;
        lead.address = result.formattedAddress != null ? result.formattedAddress : result.vicinity;
        if (result.geometry != null && result.geometry.location != null) {
            lead.latitude = result.geometry.location.lat;
            lead.longitude = result.geometry.location.lng;
        }
        lead.rating = result.rating;
        lead.reviewCount = result.userRatingsTotal;
        lead.phone = result.formattedPhoneNumber;
        lead.website = result.website;
        
        if (result.types != null && !result.types.isEmpty()) {
            lead.category = result.types.get(0);
        }

        lead.updatedAt = new Date();
        leadRepository.persist(lead);
    }
}
