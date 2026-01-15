package com.foodgrid.admin.rest;

import com.foodgrid.admin.dto.PosDeviceResponse;
import com.foodgrid.admin.dto.PosDeviceUpdateRequest;
import com.foodgrid.admin.service.DeviceAdminService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api/v1/admin/outlets/{outletId}/devices")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN","MANAGER"})
public class DeviceAdminResource {

  @Inject DeviceAdminService deviceAdminService;

  @GET
  public List<PosDeviceResponse> list(@PathParam("outletId") String outletId) {
    return deviceAdminService.list(outletId);
  }

  @PUT
  @Path("/{deviceId}")
  public PosDeviceResponse update(
    @PathParam("outletId") String outletId,
    @PathParam("deviceId") String deviceId,
    @Valid PosDeviceUpdateRequest request
  ) {
    return deviceAdminService.update(outletId, deviceId, request);
  }

  @DELETE
  @Path("/{deviceId}")
  public void delete(@PathParam("outletId") String outletId, @PathParam("deviceId") String deviceId) {
    deviceAdminService.delete(outletId, deviceId);
  }
}
