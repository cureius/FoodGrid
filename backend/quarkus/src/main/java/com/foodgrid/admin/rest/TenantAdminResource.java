package com.foodgrid.admin.rest;

import com.foodgrid.admin.dto.ClientResponse;
import com.foodgrid.admin.dto.ClientUpsertRequest;
import com.foodgrid.admin.service.TenantAdminService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api/v1/admin/tenants")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN"})
public class TenantAdminResource {

  @Inject TenantAdminService tenantAdminService;

  @GET
  public List<ClientResponse> list() {
    return tenantAdminService.list();
  }

  @GET
  @Path("/{tenantId}")
  public ClientResponse get(@PathParam("tenantId") String tenantId) {
    return tenantAdminService.get(tenantId);
  }

  @POST
  public ClientResponse create(@Valid ClientUpsertRequest request) {
    return tenantAdminService.create(request);
  }

  @PUT
  @Path("/{tenantId}")
  public ClientResponse update(@PathParam("tenantId") String tenantId, @Valid ClientUpsertRequest request) {
    return tenantAdminService.update(tenantId, request);
  }

  @DELETE
  @Path("/{tenantId}")
  public void delete(@PathParam("tenantId") String tenantId) {
    tenantAdminService.delete(tenantId);
  }

  @PUT
  @Path("/{tenantId}/activate")
  public ClientResponse activate(@PathParam("tenantId") String tenantId) {
    return tenantAdminService.activate(tenantId);
  }

  @PUT
  @Path("/{tenantId}/deactivate")
  public ClientResponse deactivate(@PathParam("tenantId") String tenantId) {
    return tenantAdminService.deactivate(tenantId);
  }
}
