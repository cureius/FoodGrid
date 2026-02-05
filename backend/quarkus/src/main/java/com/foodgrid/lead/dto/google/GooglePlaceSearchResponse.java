package com.foodgrid.lead.dto.google;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class GooglePlaceSearchResponse {
    public List<GooglePlaceResult> results;
    
    @JsonProperty("next_page_token")
    public String nextPageToken;
    
    public String status;
}
