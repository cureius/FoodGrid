package com.foodgrid.payment.rest;

import com.foodgrid.payment.dto.PaymentConfigRequest;
import com.foodgrid.payment.dto.PaymentConfigResponse;
import com.foodgrid.payment.model.PaymentGatewayType;
import com.foodgrid.payment.service.PaymentConfigService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

/**
 * REST resource for managing payment gateway configurations.
 * Used by client admins to configure their payment gateways.
 */
@Path("/api/v1/payment-config")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Payment Configuration", description = "Payment gateway configuration management")
public class PaymentConfigResource {

    @Inject
    PaymentConfigService configService;

    @Inject
    JsonWebToken jwt;


    @GET
    @Path("/gateway-types")
    @RolesAllowed({"ADMIN", "TENANT_ADMIN"})
    @Operation(summary = "List supported gateway types", description = "List all supported payment gateway types")
    public PaymentGatewayType[] getSupportedGatewayTypes() {
        return PaymentGatewayType.values();
    }

    @GET
    @Path("/gateways")
    @RolesAllowed({"CLIENT_ADMIN", "SUPER_ADMIN", "ADMIN", "TENANT_ADMIN"})
    @Operation(summary = "List supported gateways", description = "List all supported payment gateway types")
    public Response listSupportedGateways() {
        final var gateways = configService.getSupportedGateways();
        return Response.ok(gateways).build();
    }

    @POST
    @Path("/{clientId}")
    @RolesAllowed({"CLIENT_ADMIN", "SUPER_ADMIN", "ADMIN", "TENANT_ADMIN"})
    @Operation(summary = "Save gateway configuration", description = "Create or update payment gateway configuration")
    public Response saveConfig(@PathParam("clientId") final String clientId, @Valid final PaymentConfigRequest request) {
        final PaymentConfigResponse response = configService.saveConfig(clientId, request);
        return Response.ok(response).build();
    }

    @GET
    @RolesAllowed({"CLIENT_ADMIN", "SUPER_ADMIN", "ADMIN", "TENANT_ADMIN"})
    @Operation(summary = "List configurations", description = "List all payment gateway configurations for the client")
    public Response listConfigs(@QueryParam("clientId") final String clientId, @QueryParam("activeOnly") @DefaultValue("false") final boolean activeOnly) {
        final List<PaymentConfigResponse> configs = activeOnly ?
            configService.getActiveConfigs(clientId) : configService.getConfigs(clientId);
        return Response.ok(configs).build();
    }

    @GET
    @Path("/{configId}")
    @RolesAllowed({"CLIENT_ADMIN", "SUPER_ADMIN", "ADMIN", "TENANT_ADMIN"})
    @Operation(summary = "Get configuration", description = "Get a specific payment gateway configuration")
    public Response getConfig(@PathParam("configId") final String configId) {
        final PaymentConfigResponse response = configService.getConfig(configId);
        return Response.ok(response).build();
    }

    @DELETE
    @Path("/{gatewayType}/{clientId}")
    @RolesAllowed({"CLIENT_ADMIN", "SUPER_ADMIN", "ADMIN", "TENANT_ADMIN"})
    @Operation(summary = "Deactivate configuration", description = "Deactivate a payment gateway configuration")
    public Response deactivateConfig(@PathParam("clientId") final String clientId, @PathParam("gatewayType") final PaymentGatewayType gatewayType) {
        configService.deactivateConfig(clientId, gatewayType);
        return Response.noContent().build();
    }

    @DELETE
    @Path("/{configId}")
    @RolesAllowed({"CLIENT_ADMIN", "SUPER_ADMIN", "ADMIN", "TENANT_ADMIN"})
    @Operation(summary = "Delete configuration", description = "Delete a payment gateway configuration permanently")
    public Response deleteConfig(@PathParam("configId") final String configId) {
        configService.deleteConfig(configId);
        return Response.noContent().build();
    }

    @PUT
    @Path("/{configId}")
    @RolesAllowed({"CLIENT_ADMIN", "SUPER_ADMIN", "ADMIN", "TENANT_ADMIN"})
    @Operation(summary = "Update configuration", description = "Update a specific payment gateway configuration")
    public Response updateConfig(@PathParam("configId") final String configId, @Valid final PaymentConfigRequest request) {
        final PaymentConfigResponse response = configService.updateConfig(configId, request);
        return Response.ok(response).build();
    }

    @PUT
    @Path("/{configId}/reactivate")
    @RolesAllowed({"CLIENT_ADMIN", "SUPER_ADMIN", "ADMIN", "TENANT_ADMIN"})
    @Operation(summary = "Reactivate configuration", description = "Reactivate a deactivated payment gateway configuration")
    public Response reactivateConfig(@PathParam("configId") final String configId) {
        final PaymentConfigResponse response = configService.reactivateConfig(configId);
        return Response.ok(response).build();
    }


    @POST
    @Path("/validate/{gatewayType}/{clientId}")
    @RolesAllowed({"CLIENT_ADMIN", "SUPER_ADMIN", "ADMIN", "TENANT_ADMIN"})
    @Operation(summary = "Validate credentials", description = "Test if the configured credentials are valid")
    public Response validateCredentials(@PathParam("clientId") final String clientId, @PathParam("gatewayType") final PaymentGatewayType gatewayType) {
        final boolean valid = configService.validateCredentials(clientId, gatewayType);
        return Response.ok(new ValidationResult(valid)).build();
    }

    record ValidationResult(boolean valid) {}
}
