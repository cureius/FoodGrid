package com.foodgrid.admin.rest;

import com.foodgrid.admin.dto.ClientResponse;
import com.foodgrid.admin.dto.ClientUpsertRequest;
import com.foodgrid.admin.service.TenantAdminService;
import com.foodgrid.payment.model.PaymentGatewayType;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/api/v1/admin/tenants")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN", "TENANT_ADMIN"})
@Tag(name = "Tenant Management", description = "Tenant and client management with payment gateway configuration")
public class TenantAdminResource {

  @Inject TenantAdminService tenantAdminService;

  @GET
  @Operation(summary = "List tenants", description = "List all tenants/clients with their configurations")
  public List<ClientResponse> list() {
    return tenantAdminService.list();
  }

  @GET
  @Path("/{tenantId}")
  @Operation(summary = "Get tenant", description = "Get a specific tenant/client by ID")
  public ClientResponse get(@PathParam("tenantId") final String tenantId) {
    return tenantAdminService.get(tenantId);
  }

  @POST
  @Operation(summary = "Create tenant", description = "Create a new tenant/client with admin user")
  public ClientResponse create(@Valid final ClientUpsertRequest request) {
    return tenantAdminService.create(request);
  }

  @PUT
  @Path("/{tenantId}")
  @Operation(summary = "Update tenant", description = "Update an existing tenant/client")
  public ClientResponse update(@PathParam("tenantId") final String tenantId, @Valid final ClientUpsertRequest request) {
    return tenantAdminService.update(tenantId, request);
  }

  @DELETE
  @Path("/{tenantId}")
  @Operation(summary = "Delete tenant", description = "Delete a tenant/client and associated admin user")
  public void delete(@PathParam("tenantId") final String tenantId) {
    tenantAdminService.delete(tenantId);
  }

  @PUT
  @Path("/{tenantId}/activate")
  @Operation(summary = "Activate tenant", description = "Activate a tenant/client")
  public ClientResponse activate(@PathParam("tenantId") final String tenantId) {
    return tenantAdminService.activate(tenantId);
  }

  @PUT
  @Path("/{tenantId}/deactivate")
  @Operation(summary = "Deactivate tenant", description = "Deactivate a tenant/client")
  public ClientResponse deactivate(@PathParam("tenantId") final String tenantId) {
    return tenantAdminService.deactivate(tenantId);
  }

  // Payment Gateway Management Endpoints

  @PUT
  @Path("/{tenantId}/payment-gateway")
  @RolesAllowed({"ADMIN", "TENANT_ADMIN"})
  @Operation(summary = "Update payment gateway", description = "Update payment gateway configuration for a tenant")
  public ClientResponse updatePaymentGateway(@PathParam("tenantId") final String tenantId,
                                             @Valid final PaymentGatewayUpdateRequest request) {
    return tenantAdminService.updatePaymentGateway(tenantId, request);
  }

  @PUT
  @Path("/{tenantId}/toggle-payments")
  @RolesAllowed({"ADMIN", "TENANT_ADMIN"})
  @Operation(summary = "Toggle payments", description = "Enable or disable payments for a tenant")
  public ClientResponse togglePayments(@PathParam("tenantId") final String tenantId,
                                       @QueryParam("enabled") final boolean enabled) {
    return tenantAdminService.togglePayments(tenantId, enabled);
  }

  @GET
  @Path("/payments-enabled")
  @RolesAllowed({"ADMIN", "TENANT_ADMIN"})
  @Operation(summary = "List tenants with payments", description = "List all tenants that have payments enabled")
  public List<ClientResponse> getTenantsWithPaymentsEnabled() {
    return tenantAdminService.getTenantsWithPaymentsEnabled();
  }

  @GET
  @Path("/active-with-payments")
  @RolesAllowed({"ADMIN", "TENANT_ADMIN"})
  @Operation(summary = "List active tenants with payments", description = "List active tenants that have payments enabled")
  public List<ClientResponse> getActiveTenantsWithPaymentsEnabled() {
    return tenantAdminService.getActiveTenantsWithPaymentsEnabled();
  }

  @GET
  @Path("/gateway-types")
  @RolesAllowed({"ADMIN", "TENANT_ADMIN"})
  @Operation(summary = "List supported gateway types", description = "List all supported payment gateway types")
  public PaymentGatewayType[] getSupportedGatewayTypes() {
    return PaymentGatewayType.values();
  }

  // Payment Gateway Update Request Record
  public record PaymentGatewayUpdateRequest(
          PaymentGatewayType defaultGatewayType,
          boolean paymentEnabled,
          boolean autoCaptureEnabled,
          boolean partialRefundEnabled,
          String webhookUrl,
          String paymentGatewayConfig
  ) {
  }
}

