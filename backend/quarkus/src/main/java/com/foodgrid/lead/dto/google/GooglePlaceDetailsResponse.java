package com.foodgrid.lead.dto.google;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class GooglePlaceDetailsResponse {
    public GooglePlaceResult result;
    public String status;
}
