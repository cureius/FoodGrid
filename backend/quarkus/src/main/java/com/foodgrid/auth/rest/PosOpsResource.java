package com.foodgrid.auth.rest;

import com.foodgrid.auth.dto.LogoutResponse;
import com.foodgrid.auth.dto.ShiftCloseResponse;
import com.foodgrid.auth.service.PosOpsService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/v1/pos")
@Consumes(MediaType.WILDCARD)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"CASHIER","MANAGER","ADMIN"})
public class PosOpsResource {

  @Inject PosOpsService posOpsService;

  @GET
  @Path("/ping")
  public String ping() {
    return "OK";
  }

  @POST
  @Path("logout")
  public LogoutResponse logout() {
    return posOpsService.logout();
  }

  @POST
  @Path("shift/close")
  public ShiftCloseResponse closeShift() {
    return posOpsService.closeShift();
  }
}
