package com.foodgrid.auth.rest;

import com.foodgrid.auth.dto.*;
import com.foodgrid.auth.service.AuthService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/api/v1/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {

  @Inject AuthService authService;

  @GET
  @Path("/login-context")
  public LoginContextResponse getLoginContext(@QueryParam("deviceId") String deviceId) {
    if (deviceId == null || deviceId.isBlank()) {
      throw new BadRequestException("deviceId is required");
    }
    return authService.getLoginContext(deviceId);
  }

  @POST
  @Path("/login/pin")
  public LoginResponse loginWithPin(@Valid LoginWithPinRequest request) {
    return authService.loginWithPin(request);
  }

  @POST
  @Path("/pin-otp/request")
  public PinOtpRequestResponse requestPinOtp(@Valid PinOtpRequest request) {
    return authService.requestPinOtp(request);
  }

  @POST
  @Path("/pin-otp/resend")
  public PinOtpResendResponse resendPinOtp(@Valid PinOtpResendRequest request) {
    return authService.resendPinOtp(request);
  }

  @POST
  @Path("/pin-otp/verify")
  public LoginResponse verifyPinOtp(@Valid PinOtpVerifyRequest request) {
    return authService.verifyPinOtp(request);
  }
}
