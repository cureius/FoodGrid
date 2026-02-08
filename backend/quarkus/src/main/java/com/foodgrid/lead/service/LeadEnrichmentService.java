package com.foodgrid.lead.service;

import com.foodgrid.lead.model.Lead;
import com.foodgrid.lead.model.LeadContact;
import com.foodgrid.lead.model.LeadStatus;
import com.foodgrid.lead.repo.LeadContactRepository;
import com.foodgrid.lead.repo.LeadRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@ApplicationScoped
public class LeadEnrichmentService {

    private static final Logger LOG = Logger.getLogger(LeadEnrichmentService.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+");
    private static final Pattern PHONE_PATTERN = Pattern.compile("(?:\\+91|0)?[6-9]\\d{9}");

    @Inject
    LeadRepository leadRepository;

    @Inject
    LeadContactRepository leadContactRepository;

    @Inject
    LeadScoringService leadScoringService;

    @Transactional
    public void enrichLeads() {
        // Simple logic: find DISCOVERED leads with a website
        List<Lead> toEnrich = leadRepository.find("status = ?1 and website is not null", LeadStatus.DISCOVERED).list();
        LOG.infof("Enriching %d leads", toEnrich.size());

        for (Lead lead : toEnrich) {
            try {
                enrichLead(lead);
            } catch (Exception e) {
                LOG.errorf("Failed to enrich lead: %s", lead.name, e);
            }
        }
    }

    private void enrichLead(Lead lead) throws Exception {
        LOG.infof("Crawling website: %s for lead: %s", lead.website, lead.name);
        
        Document doc = Jsoup.connect(lead.website)
                .timeout(10000)
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .get();
        
        String text = doc.text();
        String html = doc.html();
        
        Set<String> emails = extractEmails(text);
        Set<String> phones = extractPhones(text);
        
        boolean newContactAdded = false;
        
        for (String email : emails) {
            if (leadContactRepository.find("lead = ?1 and email = ?2", lead, email).firstResult() == null) {
                LeadContact contact = new LeadContact();
                contact.lead = lead;
                contact.email = email;
                contact.source = "WEBSITE_CRAWL";
                // Simple heuristic for SPOC
                if (email.contains("hello") || email.contains("info") || email.contains("contact") || email.contains("admin")) {
                    contact.role = "General Query";
                } else {
                    contact.isSpoc = true;
                    contact.role = "Possible Owner/Manager";
                }
                leadContactRepository.persist(contact);
                newContactAdded = true;
            }
        }
        
        for (String phone : phones) {
             if (leadContactRepository.find("lead = ?1 and phone = ?2", lead, phone).firstResult() == null) {
                LeadContact contact = new LeadContact();
                contact.lead = lead;
                contact.phone = phone;
                contact.source = "WEBSITE_CRAWL";
                leadContactRepository.persist(contact);
                newContactAdded = true;
            }
        }
        
        lead.status = LeadStatus.QUALIFIED;
        lead.score = leadScoringService.calculateScore(lead);
        lead.updatedAt = new Date();
        leadRepository.persist(lead);
    }

    private Set<String> extractEmails(String text) {
        Set<String> emails = new HashSet<>();
        Matcher matcher = EMAIL_PATTERN.matcher(text);
        while (matcher.find()) {
            emails.add(matcher.group());
        }
        return emails;
    }

    private Set<String> extractPhones(String text) {
        Set<String> phones = new HashSet<>();
        Matcher matcher = PHONE_PATTERN.matcher(text);
        while (matcher.find()) {
            phones.add(matcher.group());
        }
        return phones;
    }
}
