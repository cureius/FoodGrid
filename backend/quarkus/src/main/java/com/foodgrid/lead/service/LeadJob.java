package com.foodgrid.lead.service;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

@ApplicationScoped
public class LeadJob {

    private static final Logger LOG = Logger.getLogger(LeadJob.class);

    @Inject
    LeadNormalizationService normalizationService;

    @Inject
    LeadEnrichmentService enrichmentService;

    // Run every 5 minutes to process new raw data
    @Scheduled(every = "5m", identity = "lead-normalization-job")
    void runNormalization() {
        LOG.info("Executing scheduled lead normalization");
        normalizationService.normalizeUnprocessedLeads();
    }

    // Run every 10 minutes to enrich newly qualified leads
    @Scheduled(every = "10m", identity = "lead-enrichment-job")
    void runEnrichment() {
        LOG.info("Executing scheduled lead enrichment");
        enrichmentService.enrichLeads();
    }
}
