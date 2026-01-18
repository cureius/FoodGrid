package com.foodgrid.admin.rest;

import com.foodgrid.admin.dto.AdminUserCreateRequest;
import com.foodgrid.admin.service.AdminUserAdminService;
import com.foodgrid.admin.service.AdminAuthService;
import com.foodgrid.admin.dto.AdminLoginRequest;
import com.foodgrid.admin.dto.AdminLoginResponse;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
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
  @Transactional
  public Response bootstrapAdmin(@Valid final AdminUserCreateRequest request) {
    // 1) Ensure bootstrap admin exists
    try {
      adminUserAdminService.bootstrap(request);
    } catch (final Exception ignored) {
      // If the email already exists (or any bootstrap precondition), we still try login below.
      // This keeps the endpoint usable in dev when re-running scripts.
    }

    // 2) Auto-login to return tokens
    final AdminLoginRequest loginRequest = new AdminLoginRequest(request.email(), request.password(), null);
    final AdminLoginResponse loginResponse = adminAuthService.login(loginRequest);

    return Response.ok(loginResponse).build();
  }
}
