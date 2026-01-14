package com.foodgrid.admin.rest;

import com.foodgrid.admin.dto.OutletResponse;
import com.foodgrid.admin.dto.OutletUpsertRequest;
import com.foodgrid.admin.service.OutletAdminService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api/v1/admin/outlets")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN"})
public class OutletAdminResource {

  @Inject OutletAdminService outletAdminService;

  @GET
  public List<OutletResponse> list() {
    return outletAdminService.list();
  }

  @POST
  public OutletResponse create(@Valid OutletUpsertRequest request) {
    return outletAdminService.create(request);
  }

  @PUT
  @Path("/{outletId}")
  public OutletResponse update(@PathParam("outletId") String outletId, @Valid OutletUpsertRequest request) {
    return outletAdminService.update(outletId, request);
  }

  @DELETE
  @Path("/{outletId}")
  public void delete(@PathParam("outletId") String outletId) {
    outletAdminService.delete(outletId);
  }
}
