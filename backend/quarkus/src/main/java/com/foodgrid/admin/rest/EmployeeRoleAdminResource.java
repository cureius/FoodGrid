package com.foodgrid.admin.rest;

import com.foodgrid.admin.dto.EmployeeRolesResponse;
import com.foodgrid.admin.dto.EmployeeRolesUpdateRequest;
import com.foodgrid.admin.service.EmployeeRoleAdminService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/api/v1/admin/outlets/{outletId}/employees/{employeeId}/roles")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN","MANAGER"})
public class EmployeeRoleAdminResource {

  @Inject EmployeeRoleAdminService employeeRoleAdminService;

  @GET
  public EmployeeRolesResponse get(@PathParam("outletId") String outletId, @PathParam("employeeId") String employeeId) {
    return employeeRoleAdminService.get(outletId, employeeId);
  }

  @PUT
  public EmployeeRolesResponse update(
    @PathParam("outletId") String outletId,
    @PathParam("employeeId") String employeeId,
    @Valid EmployeeRolesUpdateRequest request
  ) {
    return employeeRoleAdminService.update(outletId, employeeId, request);
  }
}
