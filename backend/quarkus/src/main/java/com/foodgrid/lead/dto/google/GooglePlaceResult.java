package com.foodgrid.lead.dto.google;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class GooglePlaceResult {
    @JsonProperty("place_id")
    public String placeId;
    
    public String name;
    
    @JsonProperty("formatted_address")
    public String formattedAddress;
    
    @JsonProperty("vicinity")
    public String vicinity;
    
    public Geometry geometry;
    public List<String> types;
    public Double rating;
    
    @JsonProperty("user_ratings_total")
    public Integer userRatingsTotal;
    
    @JsonProperty("international_phone_number")
    public String internationalPhoneNumber;
    
    @JsonProperty("formatted_phone_number")
    public String formattedPhoneNumber;
    
    public String website;
    
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Geometry {
        public Location location;
    }
    
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Location {
        public Double lat;
        public Double lng;
    }
}
