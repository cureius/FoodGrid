package com.foodgrid.pos.rest;

import com.foodgrid.pos.dto.DiningTableResponse;
import com.foodgrid.pos.dto.DiningTableUpsertRequest;
import com.foodgrid.pos.service.TableAdminService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api/v1/admin/outlets/{outletId}/tables")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN","MANAGER"})
public class TableAdminResource {

  @Inject TableAdminService tableAdminService;

  @GET
  public List<DiningTableResponse> list(@PathParam("outletId") String outletId) {
    return tableAdminService.list(outletId);
  }

  @POST
  public DiningTableResponse create(@PathParam("outletId") String outletId, @Valid DiningTableUpsertRequest request) {
    return tableAdminService.create(outletId, request);
  }

  @PUT
  @Path("/{tableId}")
  public DiningTableResponse update(
    @PathParam("outletId") String outletId,
    @PathParam("tableId") String tableId,
    @Valid DiningTableUpsertRequest request
  ) {
    return tableAdminService.update(outletId, tableId, request);
  }

  @DELETE
  @Path("/{tableId}")
  public void delete(@PathParam("outletId") String outletId, @PathParam("tableId") String tableId) {
    tableAdminService.delete(outletId, tableId);
  }
}
