package com.foodgrid.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class CustomerAuthDto {

    public static class RequestOtpRequest {
        @NotBlank
        @Pattern(regexp = "^[0-9]{10}$", message = "Invalid mobile number")
        public String mobileNumber;
    }

    public static class VerifyOtpRequest {
        @NotBlank
        @Pattern(regexp = "^[0-9]{10}$", message = "Invalid mobile number")
        public String mobileNumber;

        @NotBlank
        @Pattern(regexp = "^[0-9]{6}$", message = "Invalid OTP")
        public String otp;
    }

    public static class CustomerLoginResponse {
        public String token;
        public CustomerProfile profile;
    }

    public static class CustomerProfile {
        public String id;
        public String mobileNumber;
        public String displayName;
        public String avatarUrl;
    }
}
