package com.foodgrid.auth.rest;

import com.foodgrid.auth.dto.CustomerAuthDto.*;
import com.foodgrid.auth.service.CustomerAuthService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import io.smallrye.mutiny.Uni;
import io.smallrye.common.annotation.Blocking;
import java.util.Map;

@Path("/api/v1/customer/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@jakarta.annotation.security.PermitAll
@Blocking
@Tag(name = "Customer Auth", description = "Mobile + OTP based authentication for customers")
public class CustomerAuthResource {

    @Inject
    CustomerAuthService customerAuthService;

    @POST
    @Path("/request-otp")
    @Operation(summary = "Request OTP", description = "Send a 6-digit OTP to the customer mobile number")
    public void requestOtp(@Valid final RequestOtpRequest request) {
        customerAuthService.requestOtp(request);
    }

    @POST
    @Path("/request-email-otp")
    @Operation(summary = "Request Email OTP", description = "Send a 6-digit OTP to the customer email address")
    public Uni<Response> requestEmailOtp(@Valid final RequestEmailOtpRequest request) {
        return customerAuthService.requestEmailOtp(request)
                // Use Map.of for a clean JSON response: {"message": "OTP sent successfully"}
                .map(v -> Response.ok().entity(Map.of("message", "OTP sent successfully")).build())
                .onFailure().recoverWithItem(e -> {
                    // Return success even on failure to prevent email enumeration attacks
                    return Response.ok().entity(Map.of("message", "OTP sent successfully")).build();
                });
    }

    @POST
    @Path("/verify-otp")
    @Operation(summary = "Verify OTP", description = "Verify OTP and return customer access token")
    public CustomerLoginResponse verifyOtp(@Valid final VerifyOtpRequest request) {
        return customerAuthService.verifyOtp(request);
    }

    @POST
    @Path("/verify-email-otp")
    @Operation(summary = "Verify Email OTP", description = "Verify Email OTP and return customer access token")
    public CustomerLoginResponse verifyEmailOtp(@Valid final VerifyEmailOtpRequest request) {
        return customerAuthService.verifyEmailOtp(request);
    }

    @POST
    @Path("/google")
    @Operation(summary = "Google Login", description = "Verify Google ID Token and return customer access token")
    public CustomerLoginResponse googleLogin(@Valid final VerifyGoogleTokenRequest request) {
        return customerAuthService.verifyGoogleToken(request);
    }

    @POST
    @Path("/login-passkey")
    @Operation(summary = "Passkey Login", description = "Login with Email and Mobile (as passkey) for onboarded users")
    public CustomerLoginResponse loginWithPasskey(@Valid final PasskeyLoginRequest request) {
        return customerAuthService.loginWithPasskey(request);
    }
}