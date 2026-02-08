package com.foodgrid.lead.service;

import com.foodgrid.lead.model.Lead;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Arrays;
import java.util.List;

@ApplicationScoped
public class LeadScoringService {

    private static final List<String> HIGH_PRIORITY_CATEGORIES = Arrays.asList(
        "restaurant", "cafe", "food", "establishment", "bakery", "bar"
    );

    public Double calculateScore(Lead lead) {
        double score = 0.0;

        // Rating influence (0-50 points)
        if (lead.rating != null) {
            score += lead.rating * 10;
        }

        // Review count influence (up to 30 points)
        if (lead.reviewCount != null) {
            if (lead.reviewCount > 1000) score += 30;
            else if (lead.reviewCount > 500) score += 20;
            else if (lead.reviewCount > 100) score += 10;
            else if (lead.reviewCount > 10) score += 5;
        }

        // Online presence (20 points)
        if (lead.website != null && !lead.website.isEmpty()) {
            score += 15;
        }
        if (lead.phone != null && !lead.phone.isEmpty()) {
            score += 5;
        }

        // Category relevance (20 points)
        if (lead.category != null) {
            String category = lead.category.toLowerCase();
            if (HIGH_PRIORITY_CATEGORIES.stream().anyMatch(category::contains)) {
                score += 20;
            }
        }
        
        // Contact enrichments (up to 30 points)
        if (lead.contacts != null && !lead.contacts.isEmpty()) {
             score += Math.min(lead.contacts.size() * 5, 30);
        }

        return score;
    }
}
