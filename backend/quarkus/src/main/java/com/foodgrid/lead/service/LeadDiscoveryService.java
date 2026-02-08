package com.foodgrid.lead.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodgrid.lead.dto.google.GooglePlaceDetailsResponse;
import com.foodgrid.lead.dto.google.GooglePlaceResult;
import com.foodgrid.lead.dto.google.GooglePlaceSearchResponse;
import com.foodgrid.lead.model.RawPlaceData;
import com.foodgrid.lead.repo.RawPlaceDataRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;

import java.util.Date;

@ApplicationScoped
public class LeadDiscoveryService {

    private static final Logger LOG = Logger.getLogger(LeadDiscoveryService.class);

    @Inject
    @RestClient
    GooglePlacesClient googlePlacesClient;

    @Inject
    RawPlaceDataRepository rawPlaceDataRepository;

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "google.places.api.key")
    String apiKey;

    public void discoverLeads(final String city, final String area, final String category) {
        LOG.infof("Starting lead discovery for city: %s, area: %s, category: %s", city, area, category);
        
        final String query = category + " in " + (area != null ? area + ", " : "") + city;
        String pageToken = null;
        
        do {
            try {
                // Fetch RAW JSON String
                final String rawJsonResponse = googlePlacesClient.textSearch(query, apiKey, pageToken);
                LOG.info("RAW SEARCH RESPONSE: " + rawJsonResponse);
                
                final GooglePlaceSearchResponse response = objectMapper.readValue(rawJsonResponse, GooglePlaceSearchResponse.class);
                
                if (response != null && "OK".equals(response.status)) {
                    for (final GooglePlaceResult result : response.results) {
                        try {
                            // Fetch full details as RAW JSON
                            final String rawDetailsJson = googlePlacesClient.getDetails(result.placeId, 
                                "name,formatted_address,geometry,vicinity,types,rating,user_ratings_total,international_phone_number,formatted_phone_number,website", 
                                apiKey);
                            
                            LOG.info("RAW DETAILS RESPONSE: " + rawDetailsJson);
                            
                            final GooglePlaceDetailsResponse details = objectMapper.readValue(rawDetailsJson, GooglePlaceDetailsResponse.class);
                            
                            if (details != null && "OK".equals(details.status)) {
                                saveRawData(result.placeId, rawDetailsJson);
                            } else {
                                // Fallback: save search result raw JSON
                                saveRawData(result.placeId, objectMapper.writeValueAsString(result));
                            }
                        } catch (final Exception e) {
                            LOG.errorf("Failed to fetch details for place %s: %s", result.placeId, e.getMessage());
                            saveRawData(result.placeId, objectMapper.writeValueAsString(result));
                        }
                    }
                    pageToken = response.nextPageToken;
                    
                    if (pageToken != null) {
                        Thread.sleep(2000); 
                    }
                } else {
                    LOG.errorf("Error from Google Places API: %s", response != null ? response.status : "null");
                    break;
                }
            } catch (final Exception e) {
                LOG.error("Failed to fetch discovery data", e);
                break;
            }
        } while (pageToken != null);
    }

    @Transactional
    public void saveRawData(final String externalPlaceId, final String rawJson) {
        try {
            final RawPlaceData existing = rawPlaceDataRepository.findByExternalPlaceId(externalPlaceId);
            if (existing == null) {
                final RawPlaceData rawData = new RawPlaceData();
                rawData.externalPlaceId = externalPlaceId;
                rawData.rawJson = rawJson; // Actual raw JSON from API
                rawData.discoveredAt = new Date();
                rawData.isProcessed = false;
                rawPlaceDataRepository.persist(rawData);
            }
        } catch (final Exception e) {
            LOG.error("Failed to save raw place data", e);
        }
    }
}
