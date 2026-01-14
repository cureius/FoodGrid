package com.foodgrid.admin.rest;

import com.foodgrid.admin.dto.AdminLoginRequest;
import com.foodgrid.admin.dto.AdminLoginResponse;
import com.foodgrid.admin.service.AdminAuthService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/v1/admin/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AdminAuthResource {

  @Inject AdminAuthService adminAuthService;

  @POST
  @Path("/login")
  public AdminLoginResponse login(@Valid AdminLoginRequest request) {
    return adminAuthService.login(request);
  }
}
