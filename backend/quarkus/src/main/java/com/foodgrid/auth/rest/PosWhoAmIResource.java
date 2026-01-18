package com.foodgrid.auth.rest;

import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.jwt.JsonWebToken;

import jakarta.inject.Inject;

import java.util.LinkedHashMap;
import java.util.Map;

@Path("/api/v1/pos/whoami")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"CASHIER","MANAGER","ADMIN"})
public class PosWhoAmIResource {

  @Inject JsonWebToken jwt;

  @GET
  public Map<String, Object> whoami() {
    final Map<String, Object> m = new LinkedHashMap<>();
    m.put("sub", jwt == null ? null : jwt.getSubject());
    m.put("principalType", jwt == null ? null : jwt.getClaim("principalType"));
    m.put("outletId", jwt == null ? null : jwt.getClaim("outletId"));
    m.put("clientId", jwt == null ? null : jwt.getClaim("clientId"));
    m.put("sessionId", jwt == null ? null : jwt.getClaim("sessionId"));
    m.put("groups", jwt == null ? null : jwt.getGroups());
    return m;
  }
}
