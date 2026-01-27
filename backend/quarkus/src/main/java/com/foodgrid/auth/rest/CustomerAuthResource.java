package com.foodgrid.auth.rest;

import com.foodgrid.auth.dto.CustomerAuthDto.*;
import com.foodgrid.auth.service.CustomerAuthService;
import io.smallrye.common.annotation.Blocking;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/api/v1/customer/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@jakarta.annotation.security.PermitAll
@Tag(name = "Customer Auth", description = "Mobile + OTP based authentication for customers")
public class CustomerAuthResource {

    @Inject CustomerAuthService customerAuthService;

    @POST
    @Path("/request-otp")
    @Operation(summary = "Request OTP", description = "Send a 6-digit OTP to the customer mobile number")
    public void requestOtp(@Valid final RequestOtpRequest request) {
        customerAuthService.requestOtp(request);
    }

    @POST
    @Path("/request-email-otp")
    @Operation(summary = "Request Email OTP", description = "Send a 6-digit OTP to the customer email address")
    @Blocking
    public void requestEmailOtp(@Valid final RequestEmailOtpRequest request) {
        customerAuthService.requestEmailOtp(request);
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
}
