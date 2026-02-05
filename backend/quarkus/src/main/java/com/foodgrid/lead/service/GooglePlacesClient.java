package com.foodgrid.lead.service;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

/**
 * REST Client for Google Places API.
 * Returning String allows us to capture and store the "Raw" JSON response 
 * for compliance and traceability before parsing into DTOs.
 */
@Path("/maps/api/place")
@RegisterRestClient(configKey = "google-places-api")
@Produces(MediaType.APPLICATION_JSON)
public interface GooglePlacesClient {

    @GET
    @Path("/nearbysearch/json")
    String nearbySearch(
        @QueryParam("location") String location,
        @QueryParam("radius") Integer radius,
        @QueryParam("type") String type,
        @QueryParam("keyword") String keyword,
        @QueryParam("key") String apiKey,
        @QueryParam("pagetoken") String pageToken
    );

    @GET
    @Path("/textsearch/json")
    String textSearch(
        @QueryParam("query") String query,
        @QueryParam("key") String apiKey,
        @QueryParam("pagetoken") String pageToken
    );

    @GET
    @Path("/details/json")
    String getDetails(
        @QueryParam("place_id") String placeId,
        @QueryParam("fields") String fields,
        @QueryParam("key") String apiKey
    );
}
