package com.foodgrid.demo.rest;

public record DemoTokenResponse(
    String accessToken,
    String role,
    String outletId,
    String displayName,
    String employeeId,
    String sessionId
) {}
