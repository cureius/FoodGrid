package com.foodgrid.auth.dto;

public record PinOtpRequestResponse(String status, String challengeId, String maskedEmail) {}
