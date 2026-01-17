package com.foodgrid.admin.rest;

import com.foodgrid.admin.dto.AdminUserCreateRequest;
import com.foodgrid.admin.dto.AdminUserResponse;
import com.foodgrid.admin.service.AdminUserAdminService;
import com.foodgrid.admin.service.AdminAuthService;
import com.foodgrid.admin.dto.AdminLoginRequest;
import com.foodgrid.admin.dto.AdminLoginResponse;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/v1/bootstrap")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class BootstrapResource {

  @Inject AdminUserAdminService adminUserAdminService;
  @Inject AdminAuthService adminAuthService;

  @POST
  @Path("/admin")
  public Response bootstrapAdmin(@Valid AdminUserCreateRequest request) {
    // Create admin user for bootstrap (restaurant owner)
    AdminUserResponse admin = adminUserAdminService.bootstrap(request);
    
    // Auto-login to return tokens
    AdminLoginRequest loginRequest = new AdminLoginRequest(request.email(), request.password(), null);
    AdminLoginResponse loginResponse = adminAuthService.login(loginRequest);
    
    return Response.ok(loginResponse).build();
  }
}
