package com.foodgrid.admin.rest;

import com.foodgrid.admin.dto.*;
import com.foodgrid.admin.service.AdminUserAdminService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api/v1/admin/admin-users")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN"})
public class AdminUserAdminResource {

  @Inject AdminUserAdminService adminUserAdminService;

  @GET
  public List<AdminUserResponse> list(@QueryParam("outletId") String outletId) {
    return adminUserAdminService.list(outletId);
  }

  @POST
  public AdminUserResponse create(@Valid AdminUserCreateRequest request) {
    return adminUserAdminService.create(request);
  }

  @PUT
  @Path("/{adminUserId}")
  public AdminUserResponse update(@PathParam("adminUserId") String adminUserId, @Valid AdminUserUpdateRequest request) {
    return adminUserAdminService.update(adminUserId, request);
  }

  @DELETE
  @Path("/{adminUserId}")
  public void delete(@PathParam("adminUserId") String adminUserId) {
    adminUserAdminService.delete(adminUserId);
  }

  @PUT
  @Path("/{adminUserId}/roles")
  public AdminUserResponse updateRoles(@PathParam("adminUserId") String adminUserId, @Valid AdminUserRolesUpdateRequest request) {
    return adminUserAdminService.updateRoles(adminUserId, request);
  }
}
