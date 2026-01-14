package com.foodgrid.admin.rest;

import com.foodgrid.admin.dto.EmployeeResponse;
import com.foodgrid.admin.dto.EmployeeUpsertRequest;
import com.foodgrid.admin.service.EmployeeAdminService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api/v1/admin/outlets/{outletId}/employees")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN","MANAGER"})
public class EmployeeAdminResource {

  @Inject EmployeeAdminService employeeAdminService;

  @GET
  public List<EmployeeResponse> list(@PathParam("outletId") String outletId) {
    return employeeAdminService.list(outletId);
  }

  @POST
  public EmployeeResponse create(@PathParam("outletId") String outletId, @Valid EmployeeUpsertRequest request) {
    return employeeAdminService.create(outletId, request);
  }

  @PUT
  @Path("/{employeeId}")
  public EmployeeResponse update(
    @PathParam("outletId") String outletId,
    @PathParam("employeeId") String employeeId,
    @Valid EmployeeUpsertRequest request
  ) {
    return employeeAdminService.update(outletId, employeeId, request);
  }

  @DELETE
  @Path("/{employeeId}")
  public void delete(@PathParam("outletId") String outletId, @PathParam("employeeId") String employeeId) {
    employeeAdminService.delete(outletId, employeeId);
  }
}
