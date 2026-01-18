package com.foodgrid.auth.rest;

import com.foodgrid.auth.dto.ShiftCloseResponse;
import com.foodgrid.auth.service.PosOpsService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

/**
 * Debug-only shift endpoint.
 *
 * NOTE: The canonical endpoint is POST /api/v1/pos/shift/close (see {@link PosOpsResource}).
 * This resource is intentionally kept on a different path to avoid duplicate endpoint conflicts.
 */
@Path("/api/v1/pos/_debug/shift")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"CASHIER","MANAGER","ADMIN"})
public class PosShiftResource {

  @Inject PosOpsService posOpsService;

  @POST
  @Path("/close")
  public ShiftCloseResponse closeShift() {
    return posOpsService.closeShift();
  }
}
