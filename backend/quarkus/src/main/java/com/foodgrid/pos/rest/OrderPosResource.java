package com.foodgrid.pos.rest;

import com.foodgrid.pos.dto.*;
import com.foodgrid.pos.service.OrderPosService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api/v1/pos/orders")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"CASHIER","MANAGER","ADMIN"})
public class OrderPosResource {

  @Inject OrderPosService orderPosService;

  @POST
  public OrderResponse create(@Valid final OrderCreateRequest request, @QueryParam("outletId") final String outletId) {
    return orderPosService.create(request, outletId);
  }

  @GET
  @Path("/{orderId}")
  public OrderResponse get(@PathParam("orderId") final String orderId) {
    return orderPosService.get(orderId);
  }

  @GET
  public List<OrderResponse> list(@QueryParam("limit") final Integer limit, @QueryParam("outletId") final String outletId) {
    return orderPosService.listRecent(limit, outletId);
  }

  @POST
  @Path("/{orderId}/items")
  public OrderResponse addItem(@PathParam("orderId") final String orderId, @Valid final OrderAddItemRequest request) {
    return orderPosService.addItem(orderId, request);
  }

  @DELETE
  @Path("/{orderId}/items/{orderItemId}")
  public OrderResponse cancelItem(@PathParam("orderId") final String orderId, @PathParam("orderItemId") final String orderItemId) {
    return orderPosService.cancelItem(orderId, orderItemId);
  }

  @POST
  @Path("/{orderId}/bill")
  public OrderResponse bill(@PathParam("orderId") final String orderId) {
    return orderPosService.bill(orderId);
  }

  @POST
  @Path("/{orderId}/payments")
  public PaymentResponse pay(
    @PathParam("orderId") final String orderId,
    @HeaderParam("Idempotency-Key") final String idempotencyKey,
    @Valid final PaymentCreateRequest request
  ) {
    return orderPosService.payWithIdempotency(orderId, request, idempotencyKey);
  }

  @POST
  @Path("/{orderId}/serve")
  public OrderResponse markServed(@PathParam("orderId") final String orderId) {
    return orderPosService.markServed(orderId);
  }

  @DELETE
  @Path("/{orderId}")
  public void delete(@PathParam("orderId") final String orderId) {
    orderPosService.delete(orderId);
  }
}
