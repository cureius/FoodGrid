package com.foodgrid.admin.rest;

import com.foodgrid.admin.dto.ShiftScheduleResponse;
import com.foodgrid.admin.dto.ShiftScheduleUpsertRequest;
import com.foodgrid.admin.service.ScheduleAdminService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api/v1/admin/outlets/{outletId}/schedules")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN","MANAGER"})
public class ScheduleAdminResource {

  @Inject ScheduleAdminService scheduleAdminService;

  @GET
  public List<ShiftScheduleResponse> list(
    @PathParam("outletId") String outletId,
    @QueryParam("employeeId") String employeeId,
    @QueryParam("from") String from,
    @QueryParam("to") String to
  ) {
    return scheduleAdminService.list(outletId, employeeId, from, to);
  }

  @POST
  public ShiftScheduleResponse create(@PathParam("outletId") String outletId, @Valid ShiftScheduleUpsertRequest request) {
    return scheduleAdminService.create(outletId, request);
  }

  @PUT
  @Path("/{scheduleId}")
  public ShiftScheduleResponse update(
    @PathParam("outletId") String outletId,
    @PathParam("scheduleId") String scheduleId,
    @Valid ShiftScheduleUpsertRequest request
  ) {
    return scheduleAdminService.update(outletId, scheduleId, request);
  }

  @DELETE
  @Path("/{scheduleId}")
  public void delete(@PathParam("outletId") String outletId, @PathParam("scheduleId") String scheduleId) {
    scheduleAdminService.delete(outletId, scheduleId);
  }
}
